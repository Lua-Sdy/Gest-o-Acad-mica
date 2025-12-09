import React, { useState, useEffect } from 'react';
import { cursoService } from '../../services/apiService';
import './styles.css';

interface Curso {
    id_curso: number;
    nome_curso: string;
    carga_horaria: number;
    area: string;
    descricao: string;
}

export function CadastroCursoPage() {
    const [nome, setNome] = useState('');
    const [cargaHoraria, setCargaHoraria] = useState('');
    const [area, setArea] = useState('tecnologia');
    const [descricao, setDescricao] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [editingCursoId, setEditingCursoId] = useState<number | null>(null);

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

    useEffect(() => {
        fetchCursos();
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);

        if (!nome || !descricao || !cargaHoraria || !area) {
            setMessage('Preencha todos os campos!');
            setIsError(true);
            return;
        }

        const cursoData = {
            nome_curso: nome,
            carga_horaria: parseInt(cargaHoraria),
            area: area,
            descricao: descricao,
        };

        try {
            if (editingCursoId) {
                await cursoService.update(editingCursoId, cursoData);
                setMessage('Curso atualizado com sucesso!');
            } else {
                await cursoService.create(cursoData);
                setMessage('Curso cadastrado com sucesso!');
            }
            setIsError(false);
            // Limpa o formulário
            setNome('');
            setDescricao('');
            setCargaHoraria('');
            setArea('tecnologia');
            setEditingCursoId(null);
            fetchCursos(); // Recarrega a lista
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao salvar curso.');
            setIsError(true);
        }
    };

    const handleEdit = (curso: Curso) => {
        setNome(curso.nome_curso);
        setCargaHoraria(curso.carga_horaria.toString());
        setArea(curso.area);
        setDescricao(curso.descricao);
        setEditingCursoId(curso.id_curso);
        setMessage('');
        setIsError(false);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja deletar este curso?')) {
            try {
                await cursoService.remove(id);
                setMessage('Curso deletado com sucesso!');
                setIsError(false);
                fetchCursos(); // Recarrega a lista
            } catch (error: any) {
                setMessage(error.response?.data?.erro || 'Erro ao deletar curso.');
                setIsError(true);
            }
        }
    };

    return (
        <div id="cadastroCursoContainer">
            <div className="form-container">
                <h2>{editingCursoId ? 'Editar Curso' : 'Cadastro de Curso'}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="nome">Nome do Curso</label>
                    <input
                        type="text"
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Digite o nome do curso"
                    />

                    <label htmlFor="cargaHoraria">Carga Horária</label>
                    <input
                        type="number"
                        id="cargaHoraria"
                        value={cargaHoraria}
                        onChange={(e) => setCargaHoraria(e.target.value)}
                        placeholder="Digite a carga horária do curso"
                    />

                    <label htmlFor="area">Área</label>
                    <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
                        <option value="tecnologia">Tecnologia</option>
                        <option value="saude">Saúde</option>
                        <option value="exatas">Exatas</option>
                        <option value="humanas">Humanas</option>
                        <option value="artes">Artes</option>
                        <option value="negocios">Negócios</option>
                        <option value="turismo">Turismo</option>
                        <option value="educacao">Educação</option>
                    </select>

                    <label htmlFor="descricao">Descrição</label>
                    <textarea
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva informações sobre o curso"
                    ></textarea>

                    <button type="submit" id="botaoCadastrarCurso">{editingCursoId ? 'Atualizar Curso' : 'Cadastrar Curso'}</button>
                    {editingCursoId && (
                        <button type="button" onClick={() => {
                            setNome(''); setCargaHoraria(''); setArea('tecnologia'); setDescricao(''); setEditingCursoId(null); setMessage(''); setIsError(false);
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
                <h2>Cursos Cadastrados</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Carga Horária</th>
                            <th>Área</th>
                            <th>Descrição</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cursos.map((curso) => (
                            <tr key={curso.id_curso}>
                                <td>{curso.id_curso}</td>
                                <td>{curso.nome_curso}</td>
                                <td>{curso.carga_horaria}</td>
                                <td>{curso.area}</td>
                                <td>{curso.descricao}</td>
                                <td>
                                    <button className="edit-btn" onClick={() => handleEdit(curso)}>Editar</button>
                                    <button className="delete-btn" onClick={() => handleDelete(curso.id_curso)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
