import React, { useState, useEffect, useCallback } from 'react';
import { softwareService } from '../../services/apiService'; // Importar o serviço
import './styles.css';

interface Software {
    id_software: number;
    nome_software: string;
    observacao: string;
}

export function CadastroSoftwarePage() {
    const [softwares, setSoftwares] = useState<Software[]>([]);
    const [nomeSoftware, setNomeSoftware] = useState('');
    const [observacao, setObservacao] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [editingSoftwareId, setEditingSoftwareId] = useState<number | null>(null); // Novo estado para edição

    const fetchSoftwares = useCallback(async () => {
        try {
            const response = await softwareService.getAll(); // Usar o serviço
            setSoftwares(response.data);
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao carregar a lista de softwares.');
            setIsError(true);
        }
    }, []);

    useEffect(() => {
        fetchSoftwares();
    }, [fetchSoftwares]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);

        if (!nomeSoftware) {
            setMessage('O nome do software é obrigatório.');
            setIsError(true);
            return;
        }

        const softwareData = { nome_software: nomeSoftware, observacao };

        try {
            if (editingSoftwareId) {
                await softwareService.update(editingSoftwareId, softwareData); // Usar o serviço para update
                setMessage('Software atualizado com sucesso!');
            } else {
                await softwareService.create(softwareData); // Usar o serviço para create
                setMessage('Software cadastrado com sucesso!');
            }
            
            setNomeSoftware('');
            setObservacao('');
            setEditingSoftwareId(null); // Limpa o ID de edição
            fetchSoftwares(); // Recarrega a lista
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao salvar software.');
            setIsError(true);
        }
    };

    const handleEdit = (software: Software) => {
        setNomeSoftware(software.nome_software);
        setObservacao(software.observacao);
        setEditingSoftwareId(software.id_software);
        setMessage('');
        setIsError(false);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja deletar este software?')) {
            try {
                await softwareService.remove(id); // Usar o serviço
                setMessage('Software removido com sucesso!');
                fetchSoftwares(); // Recarrega a lista
            } catch (error: any) {
                setMessage(error.response?.data?.erro || 'Erro ao remover software.');
                setIsError(true);
            }
        }
    };

    return (
        <div id="softwareContainer">
            <div className="form-container">
                <h2>{editingSoftwareId ? 'Editar Software' : 'Cadastro de Software'}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="nomeSoftware">Nome do Software</label>
                    <input
                        type="text"
                        id="nomeSoftware"
                        value={nomeSoftware}
                        onChange={(e) => setNomeSoftware(e.target.value)}
                        placeholder="Ex: Pacote Office"
                    />

                    <label htmlFor="observacao">Observação</label>
                    <textarea
                        id="observacao"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        placeholder="Detalhes sobre o software (opcional)"
                    />

                    <button type="submit">{editingSoftwareId ? 'Atualizar Software' : 'Cadastrar Software'}</button>
                    {editingSoftwareId && (
                        <button type="button" onClick={() => {
                            setNomeSoftware(''); setObservacao(''); setEditingSoftwareId(null); setMessage(''); setIsError(false);
                        }}>Cancelar Edição</button>
                    )}

                    {message && (
                        <p style={{ color: isError ? 'red' : 'green', marginTop: '10px' }}>
                            {message}
                        </p>
                    )}
                </form>
            </div>

            <div className="table-container">
                <h2>Softwares Cadastrados</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Observação</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {softwares.map((software) => (
                            <tr key={software.id_software}>
                                <td>{software.id_software}</td>
                                <td>{software.nome_software}</td>
                                <td>{software.observacao}</td>
                                <td>
                                    <button 
                                        className="edit-btn" 
                                        onClick={() => handleEdit(software)}
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => handleDelete(software.id_software)}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
