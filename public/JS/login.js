const botao = document.getElementById('botaoLogin')
const mensagem= document.getElementById('mensagem')
botao.addEventListener('click',async()=>{
    const data ={
        email:document.getElementById('email'),
        senha:document.getElementById('senha')
    }

    try{
        const response= await fetch('/login',{
            method:'POST',
            headers :{'Content-Type' :'apllication/json'},
            body:JSON.stringify(data)
        })
        const resultado = await response.json()

        if(response.ok){
            mensagem.textContent=resultado.mensagem
            setTimeout(()=>{
                window.location.href ='/HTML/telaInicial.html'
            },2000);
        }else{
            mensagem.textContent= resultado.erro;   
        }
    }catch(error){
        mensagem.textContent="Erro ao conectar o servidor"
    }
})