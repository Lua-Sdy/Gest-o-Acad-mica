import React, { useState } from 'react'; // Remover useContext
import { useNavigate } from 'react-router-dom';
import { userService, professorService } from '../../services/apiService'; // Adicionar esta linha
import './styles.css';

export function CadastroUsuarioPage() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [senhaNovamente, setSenhaNovamente] = useState('');
    const [role, setRole] = useState('professor');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);

        if (!nome || !email || !senha || !senhaNovamente) {
            setMessage('Preencha todos os campos!');
            setIsError(true);
            return;
        }

        if (senha !== senhaNovamente) {
            setMessage('As senhas não coincidem!');
            setIsError(true);
            return;
        }

        try {
            const response = await userService.create({ nome_completo: nome, email, senha, role }); // Usar userService.create
            setMessage(response.data.mensagem || 'Usuário cadastrado com sucesso!');
            setIsError(false);

            // Se o usuário cadastrado for um professor, cria uma entrada na tabela 'professor'
            if (role === 'professor' && response.data.id_usuario) {
                await professorService.create({ id_usuario_fk: response.data.id_usuario }); // Usar professorService.create
            }
            
            // Limpa o formulário após o sucesso
            setNome('');
            setEmail('');
            setSenha('');
            setSenhaNovamente('');
            setRole('professor');
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao cadastrar usuário.');
            setIsError(true);
        }
    };

    return (
        <div id="cadastroContainer">
            <h2>Cadastro de Usuário</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="nome">Nome Completo</label>
                <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome completo"
                />

                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                />

                <label htmlFor="senha">Senha</label>
                <input
                    type="password"
                    id="senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite a senha"
                />

                <label htmlFor="senhaNovamente">Repita a senha</label>
                <input
                    type="password"
                    id="senhaNovamente"
                    value={senhaNovamente}
                    onChange={(e) => setSenhaNovamente(e.target.value)}
                    placeholder="Digite novamente a senha"
                />

                <label htmlFor="role">Papel do Usuário</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="professor">Professor</option>
                    <option value="admin">Admin</option>
                    <option value="coordinator">Coordenador</option>
                </select>

                <button type="submit" id="botaoCadastrarUsuario">Cadastrar</button>

                {message && (
                    <div id="mensagem" className={isError ? 'erro' : 'sucesso'}>
                        {message}
                    </div>
                )}
            </form>
            <button onClick={() => navigate('/')} id="botaoVoltar">
                Voltar para o Login
            </button>
        </div>
    );
}
