import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/apiService'; // Adicionar esta linha
import './styles.css';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');

        if (!email || !password) {
            setMessage('Preencha todos os campos!');
            return;
        }

        const data = {
            email: email,
            senha: password
        };

        try {
            const response = await userService.login(data); // Para esta linha

            // Axios já lida com response.ok, então podemos acessar diretamente response.data
            localStorage.setItem('authToken', response.data.token);
            navigate('/home');
            
        } catch (error: any) {
            console.error('Erro ao conectar ao servidor:', error);
            setMessage(error.response?.data?.erro || 'Erro ao conectar ao servidor. Verifique se o backend está rodando.');
        }
    };

    const handleCadastro = () => {
        navigate('/cadastro-usuario');
    };

    return (
        <div id="loginContainer">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">E-mail</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                />

                <label htmlFor="senha">Senha</label>
                <input
                    type="password"
                    id="senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                />

                <button type="submit" id="botaoLogin">Entrar</button>

                {message && <p id="mensagem">{message}</p>}
            </form>
            <button onClick={handleCadastro} id="botaoCadastrar">
                    Não tem uma conta? Cadastre-se
                </button>
        </div>
    );
}
