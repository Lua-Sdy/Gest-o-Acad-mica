// tableManager.js
// Este script é responsável por adicionar a funcionalidade de tabela editável
// e a lógica de CRUD (Create, Read, Update, Delete) básica no frontend.

document.addEventListener('DOMContentLoaded', () => {
    // Função para inicializar a tabela em um container específico
    const initializeTable = (containerId, headers, data = []) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 1. Criação da Tabela
        const table = document.createElement('table');
        table.className = 'data-table';
        table.id = `${containerId}-table`;

        // 2. Cabeçalho da Tabela
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        // Coluna para Ações (Editar/Excluir)
        const thActions = document.createElement('th');
        thActions.textContent = 'Ações';
        headerRow.appendChild(thActions);

        // 3. Corpo da Tabela
        const tbody = table.createTBody();
        tbody.id = `${containerId}-tbody`;

        // 4. Preencher com dados iniciais (se houver)
        data.forEach(rowData => addRowToTable(tbody, rowData));

        // 5. Adicionar Tabela ao Container
        container.appendChild(table);

        // 6. Adicionar Botão de Adicionar Novo
        const addButton = document.createElement('button');
        addButton.textContent = `Adicionar Novo`;
        addButton.className = 'add-new-button';
        addButton.onclick = () => addRowToTable(tbody, {});
        container.prepend(addButton);

        // 7. Adicionar Listener para Ações (Editar/Excluir)
        table.addEventListener('click', (event) => {
            const target = event.target;
            const row = target.closest('tr');
            if (!row || row.parentElement.tagName !== 'TBODY') return;

            if (target.classList.contains('edit-button')) {
                toggleEditMode(row, headers.length);
            } else if (target.classList.contains('delete-button')) {
                if (confirm('Tem certeza que deseja excluir este item?')) {
                    row.remove();
                    // Aqui você adicionaria a lógica para remover do backend
                    console.log('Item excluído (apenas frontend)');
                }
            } else if (target.classList.contains('save-button')) {
                saveRow(row, headers.length);
                toggleEditMode(row, headers.length);
                // Aqui você adicionaria a lógica para salvar no backend
                console.log('Item salvo (apenas frontend)');
            }
        });
    };

    // Função para adicionar uma nova linha à tabela
    const addRowToTable = (tbody, data) => {
        const row = tbody.insertRow();
        row.dataset.isNew = data.id ? 'false' : 'true'; // Marca como nova linha se não tiver ID

        // Adiciona células para os dados
        Object.values(data).forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });

        // Adiciona células vazias para novos itens que não têm todos os campos
        const currentCells = row.cells.length;
        const expectedCells = tbody.parentElement.querySelector('thead tr').cells.length - 1; // -1 para a coluna de Ações
        for (let i = currentCells; i < expectedCells; i++) {
            row.insertCell().textContent = '';
        }

        // Célula de Ações
        const actionCell = row.insertCell();
        actionCell.innerHTML = `
            <button class="edit-button">Editar</button>
            <button class="delete-button">Excluir</button>
        `;
        // Coloca a nova linha em modo de edição se for nova
        if (row.dataset.isNew === 'true') {
            toggleEditMode(row, expectedCells);
        }
    };

    // Função para alternar o modo de edição de uma linha
    const toggleEditMode = (row, dataCellCount) => {
        const isEditing = row.classList.toggle('editing');
        const actionCell = row.cells[dataCellCount]; // A última célula é a de ações

        if (isEditing) {
            // Entra no modo de edição
            for (let i = 0; i < dataCellCount; i++) {
                const cell = row.cells[i];
                const currentValue = cell.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                cell.textContent = '';
                cell.appendChild(input);
            }
            actionCell.innerHTML = `
                <button class="save-button">Salvar</button>
                <button class="delete-button">Excluir</button>
            `;
        } else {
            // Sai do modo de edição (se não for o botão salvar que chamou)
            if (!actionCell.querySelector('.save-button')) {
                for (let i = 0; i < dataCellCount; i++) {
                    const cell = row.cells[i];
                    const input = cell.querySelector('input');
                    if (input) {
                        cell.textContent = input.value;
                    }
                }
                actionCell.innerHTML = `
                    <button class="edit-button">Editar</button>
                    <button class="delete-button">Excluir</button>
                `;
            }
        }
    };

    // Função para salvar os dados da linha (apenas no frontend)
    const saveRow = (row, dataCellCount) => {
        const data = {};
        const headers = Array.from(row.parentElement.parentElement.querySelector('thead tr').cells).slice(0, dataCellCount).map(th => th.textContent);

        for (let i = 0; i < dataCellCount; i++) {
            const cell = row.cells[i];
            const input = cell.querySelector('input');
            if (input) {
                data[headers[i]] = input.value;
                cell.textContent = input.value; // Atualiza o texto da célula
            }
        }
        row.dataset.isNew = 'false'; // Não é mais uma nova linha após salvar
        console.log('Dados da linha salvos:', data);
    };

    // --- Inicialização das Tabelas ---

    // 1. Tabela de Disciplinas
    const disciplinaHeaders = ['Nome da Disciplina', 'Carga Horária Prática', 'Carga Horária Teórica'];
    // Dados de exemplo (simulando dados existentes)
    const disciplinaData = [
        { id: 1, nome: 'Programação Web', chp: '40h', cht: '40h' },
        { id: 2, nome: 'Banco de Dados', chp: '20h', cht: '60h' }
    ];
    // Adiciona um novo container para a tabela de disciplinas
    const disciplinaContainer = document.createElement('div');
    disciplinaContainer.id = 'disciplinaTableContainer';
    // Encontra o elemento onde o formulário de cadastro de disciplina está
    const disciplinaFormContainer = document.getElementById('disciplinaContainer');
    if (disciplinaFormContainer) {
        disciplinaFormContainer.parentElement.insertBefore(disciplinaContainer, disciplinaFormContainer.nextSibling);
        initializeTable('disciplinaTableContainer', disciplinaHeaders, disciplinaData);
    }


    // 2. Tabela de Cursos
    const cursoHeaders = ['Nome do Curso', 'Duração (Anos)'];
    const cursoData = [
        { id: 1, nome: 'Análise e Desenvolvimento de Sistemas', duracao: '2.5' },
        { id: 2, nome: 'Engenharia de Software', duracao: '5' }
    ];
    const cursoFormContainer = document.getElementById('cursoContainer'); // Assumindo que existe um container no HTML de curso
    if (cursoFormContainer) {
        const cursoTableContainer = document.createElement('div');
        cursoTableContainer.id = 'cursoTableContainer';
        cursoFormContainer.parentElement.insertBefore(cursoTableContainer, cursoFormContainer.nextSibling);
        initializeTable('cursoTableContainer', cursoHeaders, cursoData);
    }

    // 3. Tabela de Salas
    const salaHeaders = ['Nome da Sala', 'Capacidade'];
    const salaData = [
        { id: 1, nome: 'Sala 101', capacidade: '30' },
        { id: 2, nome: 'Laboratório A', capacidade: '20' }
    ];
    const salaFormContainer = document.getElementById('salaContainer'); // Assumindo que existe um container no HTML de sala
    if (salaFormContainer) {
        const salaTableContainer = document.createElement('div');
        salaTableContainer.id = 'salaTableContainer';
        salaFormContainer.parentElement.insertBefore(salaTableContainer, salaFormContainer.nextSibling);
        initializeTable('salaTableContainer', salaHeaders, salaData);
    }
});

// Exporta a função para ser usada em outros contextos se necessário
// window.initializeTable = initializeTable;
