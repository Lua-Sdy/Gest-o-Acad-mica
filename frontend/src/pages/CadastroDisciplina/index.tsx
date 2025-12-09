import React, { useState, useEffect } from 'react';
import { disciplinaService, cursoService } from '../../services/apiService';
import './styles.css';

interface CursoOption {
    id_curso: number;
    nome_curso: string;
}

interface Disciplina {
    id: number; // id_disciplina no backend
    nome: string; // nome_disciplina no backend
    ch_pratica: number;
    ch_teorica: number;
    carga_horaria: number;
    total_de_encontros: number;
    nome_curso: string;
    id_curso: number; // id_curso_fk no backend
}

export function CadastroDisciplinaPage() {
    const [nome, setNome] = useState('');
    const [cursoId, setCursoId] = useState('');
    const [chPratica, setChPratica] = useState('');
    const [chTeorica, setChTeorica] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [cursos, setCursos] = useState<CursoOption[]>([]);
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [editingDisciplinaId, setEditingDisciplinaId] = useState<number | null>(null);

    const fetchCursos = async () => {
        try {
            const response = await cursoService.getAll();
            setCursos(response.data);
        } catch (error: any) {
            console.error("Erro ao buscar cursos:", error);
            setMessage(error.response?.data?.erro || 'Erro ao carregar cursos.');
            setIsError(true);
        }
    };

    const fetchDisciplinas = async () => {
        try {
            const response = await disciplinaService.getAll();
            setDisciplinas(response.data);
        } catch (error: any) {
            console.error("Erro ao buscar disciplinas:", error);
            setMessage(error.response?.data?.erro || 'Erro ao carregar disciplinas.');
            setIsError(true);
        }
    };

    useEffect(() => {
        fetchCursos();
        fetchDisciplinas();
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);

        if (!nome || !cursoId || chPratica === '' || chTeorica === '') {
            setMessage('Preencha todos os campos!');
            setIsError(true);
            return;
        }

        const disciplinaData = {
            nome_disciplina: nome,
            id_curso_fk: parseInt(cursoId),
            ch_pratica: parseFloat(chPratica),
            ch_teorica: parseFloat(chTeorica)
        };

        try {
            if (editingDisciplinaId) {
                await disciplinaService.update(editingDisciplinaId, disciplinaData);
                setMessage('Disciplina atualizada com sucesso!');
            } else {
                await disciplinaService.create(disciplinaData);
                setMessage('Disciplina cadastrada com sucesso!');
            }
            setIsError(false);
            // Limpa o formulário
            setNome('');
            setCursoId('');
            setChPratica('');
            setChTeorica('');
            setEditingDisciplinaId(null);
            fetchDisciplinas(); // Recarrega a lista
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao salvar disciplina.');
            setIsError(true);
        }
    };

    const handleEdit = (disciplina: Disciplina) => {
        setNome(disciplina.nome);
        setCursoId(disciplina.id_curso.toString());
        setChPratica(disciplina.ch_pratica.toString());
        setChTeorica(disciplina.ch_teorica.toString());
        setEditingDisciplinaId(disciplina.id);
        setMessage('');
        setIsError(false);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja deletar esta disciplina?')) {
            try {
                await disciplinaService.remove(id);
                setMessage('Disciplina deletada com sucesso!');
                setIsError(false);
                fetchDisciplinas(); // Recarrega a lista
            } catch (error: any) {
                setMessage(error.response?.data?.erro || 'Erro ao deletar disciplina.');
                setIsError(true);
            }
        }
    };

    return (
        <div className="cadastroDisciplinaContainer">
            <div className="form-container">
                <h2>{editingDisciplinaId ? 'Editar Disciplina' : 'Cadastro de Disciplina'}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="nome">Nome da Disciplina</label>
                    <input
                        type="text"
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Digite o nome da disciplina"
                    />

                    <label htmlFor="curso">Curso</label>
                    <select id="curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                        <option value="">Selecione um curso</option>
                        {cursos.map((curso) => (
                            <option key={curso.id_curso} value={curso.id_curso}>
                                {curso.nome_curso}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="chPratica">Carga Horária Prática (em horas)</label>
                    <input
                        type="number"
                        id="chPratica"
                        value={chPratica}
                        onChange={(e) => setChPratica(e.target.value)}
                        step="0.01"
                    />

                    <label htmlFor="chTeorica">Carga Horária Teórica (em horas)</label>
                    <input
                        type="number"
                        id="chTeorica"
                        value={chTeorica}
                        onChange={(e) => setChTeorica(e.target.value)}
                        step="0.01"
                    />

                    <button type="submit" id="cadastrarDisciplina">{editingDisciplinaId ? 'Atualizar Disciplina' : 'Cadastrar Disciplina'}</button>
                    {editingDisciplinaId && (
                        <button type="button" onClick={() => {
                            setNome(''); setCursoId(''); setChPratica(''); setChTeorica(''); setEditingDisciplinaId(null); setMessage(''); setIsError(false);
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
                <h2>Disciplinas Cadastradas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Curso</th>
                            <th>CH Prática</th>
                            <th>CH Teórica</th>
                            <th>Carga Horária Total</th>
                            <th>Total de Encontros</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disciplinas.map((disciplina) => (
                            <tr key={disciplina.id}>
                                <td>{disciplina.id}</td>
                                <td>{disciplina.nome}</td>
                                <td>{disciplina.nome_curso}</td>
                                <td>{disciplina.ch_pratica}</td>
                                <td>{disciplina.ch_teorica}</td>
                                <td>{disciplina.carga_horaria}</td>
                                <td>{disciplina.total_de_encontros}</td>
                                <td>
                                    <button className="edit-btn" onClick={() => handleEdit(disciplina)}>Editar</button>
                                    <button className="delete-btn" onClick={() => handleDelete(disciplina.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
