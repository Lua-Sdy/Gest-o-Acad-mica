document.getElementById('botaoCadastrarSala').addEventListener('click', async () => {
    const salaData = {
        nome_sala: document.getElementById('nome_sala').value,
        tipo_sala: document.getElementById('tipo_sala').value,
        recursos_sala: document.getElementById('recursos_sala').value
    };

    try {
        const response = await fetch('/cadastroSala', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(salaData)
        });

        const result = await response.json();
        document.getElementById('mensagemSala').innerText = response.ok ? "Sala cadastrada!" : result.erro;
    } catch (error) {
        document.getElementById('mensagemSala').innerText = "Erro ao conectar ao servidor";
    }
});
