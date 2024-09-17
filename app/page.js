'use client'

import { signIn } from "@/public/utils/firebase";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await signIn(email, password);
      router.push('/home');
    } catch (error){
      console.error("Erro ao fazer login: " + error);
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className='font-bold text-2xl'> Login </h1>
      <br></br>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleLogin} className="mb-6">
        <input
          type="email"
          placeholder="E-mail"
          className="border p-2 mr-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          className="border p-2 mr-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="bg-blue-500 text-white p-2 rounded" type="submit">Entrar</button>
      </form>

      <p>Ainda não tem uma conta? <a href="/register" className="text-blue-500">Registre-se</a></p>
    </div>
  );
}
