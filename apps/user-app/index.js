import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TextInput, Button, SafeAreaView, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import SvgQRCode from 'react-native-qrcode-svg';

const API_BASE = 'http://localhost:8080/v1';

async function api(path, method = 'GET', body) {
  const token = await SecureStore.getItemAsync('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('Password123!');
  return (
    <SafeAreaView style={{ padding: 16 }}>
      <Text>Register</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <Button title="Register" onPress={async () => {
        await api('/auth/register', 'POST', { email, password });
        navigation.navigate('Login');
      }} />
      <Button title="Go to Login" onPress={() => navigation.navigate('Login')} />
    </SafeAreaView>
  );
}

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('Password123!');
  return (
    <SafeAreaView style={{ padding: 16 }}>
      <Text>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <Button title="Login" onPress={async () => {
        const res = await api('/auth/login', 'POST', { email, password });
        await SecureStore.setItemAsync('token', res.accessToken);
        navigation.navigate('Home');
      }} />
    </SafeAreaView>
  );
}

function HomeScreen({ navigation }) {
  const [balance, setBalance] = useState('0');
  useEffect(() => { (async () => { try { const res = await api('/wallets/me'); setBalance(res.balance.amount); } catch {} })(); }, []);
  return (
    <SafeAreaView style={{ padding: 16 }}>
      <Text>Balance: {balance} USDt</Text>
      <Button title="Quote + Initiate" onPress={() => navigation.navigate('Transfer')} />
      <Button title="Generate Withdrawal QR" onPress={() => navigation.navigate('QR')} />
    </SafeAreaView>
  );
}

function TransferScreen({ navigation }) {
  const [amountInr, setAmountInr] = useState('10000');
  const [quote, setQuote] = useState(null);
  return (
    <SafeAreaView style={{ padding: 16 }}>
      <Text>Amount (INR)</Text>
      <TextInput value={amountInr} onChangeText={setAmountInr} keyboardType="numeric" style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <Button title="Get Quote" onPress={async () => {
        const q = await api('/transfers/quote', 'POST', { sourceCurrency: 'INR', targetCountry: 'ZW', targetChannel: 'ECOCASH', amount: { currency: 'INR', value: parseFloat(amountInr) } });
        setQuote(q);
      }} />
      {quote && (
        <View style={{ marginVertical: 16 }}>
          <Text>Rate: {quote.rate}</Text>
          <Text>Est Target: {quote.targetEstAmount.value} {quote.targetEstAmount.currency}</Text>
          <Button title="Initiate (Demo funds wallet)" onPress={async () => {
            const res = await api('/transfers/initiate', 'POST', { quoteId: quote.quoteId, recipient: {}, sourceFunding: {}, amountUsd: 100 });
            navigation.navigate('Home');
          }} />
        </View>
      )}
    </SafeAreaView>
  );
}

function QRScreen() {
  const [data, setData] = useState(null);
  return (
    <SafeAreaView style={{ padding: 16 }}>
      <Button title="Generate QR (50 USDt)" onPress={async () => {
        const res = await api('/withdrawals/qr', 'POST', { amount: { currency: 'USDt', value: 50 }, country: 'ZW' });
        setData(res.qrJws);
      }} />
      <ScrollView contentContainerStyle={{ alignItems: 'center', marginTop: 16 }}>
        {data && <SvgQRCode value={data} size={280} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        <Stack.Screen name="QR" component={QRScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}