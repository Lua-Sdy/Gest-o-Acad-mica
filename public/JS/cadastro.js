const botao= document.getElementById("botaoCadastrar")
const mensagem= document.getElementById("mensagem")

botao.addEventListener("click", async()=>{
    
    const data= {
        nome_completo:document.getElementById('nome_completo').value,
        email:document.getElementById('email').value,
        senha:document.getElementById('senha').value,
        senhaNovamente:document.getElementById('senhaNovamente').value,
        isAdmin: document.getElementById('isAdmin').value
    }
    try{
    const response= await fetch('/cadastro', {
        method:'POST',
        headers: {'Content-Type':'application/json'},
        body:JSON.stringify(data)
    });
    const resultado= await response.json();

    if(response.ok){
        mensagem.textContent=  resultado.mensagem;
    }
    else{
        mensagem.textContent= resultado.erro;
    }
}catch(error){
    mensagem.textContent ="Erro ao conectar ao servidor";
}
}) ;