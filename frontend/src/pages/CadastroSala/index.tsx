import React, { useState, useEffect } from 'react';
import { salaService } from '../../services/apiService';
import './styles.css';

interface Sala {
    id_sala: number;
    nome_sala: string;
    tipo_sala: string;
    recursos_sala: string;
}

export function CadastroSalaPage() {
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('');
    const [recursos, setRecursos] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [editingSalaId, setEditingSalaId] = useState<number | null>(null);

    const fetchSalas = async () => {
        try {
            const response = await salaService.getAll();
            setSalas(response.data);
        } catch (error: any) {
            console.error("Erro ao buscar salas:", error);
            setMessage(error.response?.data?.erro || 'Erro ao carregar salas.');
            setIsError(true);
        }
    };

    useEffect(() => {
        fetchSalas();
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);

        if (!nome || !tipo || !recursos) {
            setMessage('Preencha todos os campos!');
            setIsError(true);
            return;
        }

        const salaData = {
            nome_sala: nome,
            tipo_sala: tipo,
            recursos_sala: recursos,
        };

        try {
            if (editingSalaId) {
                await salaService.update(editingSalaId, salaData);
                setMessage('Sala atualizada com sucesso!');
            } else {
                await salaService.create(salaData);
                setMessage('Sala cadastrada com sucesso!');
            }
            setIsError(false);
            // Limpa o formulário
            setNome('');
            setTipo('');
            setRecursos('');
            setEditingSalaId(null);
            fetchSalas(); // Recarrega a lista
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao salvar sala.');
            setIsError(true);
        }
    };

    const handleEdit = (sala: Sala) => {
        setNome(sala.nome_sala);
        setTipo(sala.tipo_sala);
        setRecursos(sala.recursos_sala);
        setEditingSalaId(sala.id_sala);
        setMessage('');
        setIsError(false);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja deletar esta sala?')) {
            try {
                await salaService.remove(id);
                setMessage('Sala deletada com sucesso!');
                setIsError(false);
                fetchSalas(); // Recarrega a lista
            } catch (error: any) {
                setMessage(error.response?.data?.erro || 'Erro ao deletar sala.');
                setIsError(true);
            }
        }
    };

    return (
        <div id="cadastroSalaContainer">
            <div className="form-container">
                <h2>{editingSalaId ? 'Editar Sala' : 'Cadastro de Sala'}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="nome_sala">Nome da Sala</label>
                    <input
                        type="text"
                        id="nome_sala"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Digite o nome da sala"
                    />

                    <label htmlFor="tipo_sala">Tipo de Sala</label>
                    <input
                        type="text"
                        id="tipo_sala"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        placeholder="Ex: Laboratório, Sala de Aula"
                    />

                    <label htmlFor="recursos_sala">Recursos da Sala</label>
                    <input
                        type="text"
                        id="recursos_sala"
                        value={recursos}
                        onChange={(e) => setRecursos(e.target.value)}
                        placeholder="Ex: Projetor, Computadores, etc."
                    />

                    <button type="submit" id="botaoCadastrarSala">{editingSalaId ? 'Atualizar Sala' : 'Cadastrar Sala'}</button>
                    {editingSalaId && (
                        <button type="button" onClick={() => {
                            setNome(''); setTipo(''); setRecursos(''); setEditingSalaId(null); setMessage(''); setIsError(false);
                        }}>Cancelar Edição</button>
                    )}

                    {message && (
                        <div id="mensagem" className={isError ? 'erro' : 'sucesso'}>
                            {message}
                        </div>
                    )}
                </form>
            </div>

            <div className="table-container">
                <h2>Salas Cadastradas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Recursos</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salas.map((sala) => (
                            <tr key={sala.id_sala}>
                                <td>{sala.id_sala}</td>
                                <td>{sala.nome_sala}</td>
                                <td>{sala.tipo_sala}</td>
                                <td>{sala.recursos_sala}</td>
                                <td>
                                    <button className="edit-btn" onClick={() => handleEdit(sala)}>Editar</button>
                                    <button className="delete-btn" onClick={() => handleDelete(sala.id_sala)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
