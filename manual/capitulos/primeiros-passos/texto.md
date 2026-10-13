# Primeiros passos

Este capítulo mostra, passo a passo, como entrar no painel, cadastrar a sua primeira câmera e colocá-la para transmitir. Leva poucos minutos. Nas imagens, os números vermelhos indicam onde você deve olhar ou clicar.

## 1. Entrar no painel

![Tela de entrada do painel](img:primeiros-passos-01-entrar)

1. Abra o painel do LiveByBit no navegador.
2. Digite o seu e-mail no campo **1**.
3. Clique em **Enviar link de acesso** (botão **2**).

Não existe senha: o acesso é feito por um link que enviamos para o seu e-mail.

## 2. Abrir o link que chegou no e-mail

![Aviso de que o link foi enviado](img:primeiros-passos-02-link-enviado)

O painel avisa que o link foi enviado (**1**). Abra o seu e-mail e clique no link para entrar. Se não encontrar a mensagem, olhe também a caixa de spam.

## 3. Conhecer o menu

![Menu do painel](img:primeiros-passos-03-painel)

No menu da esquerda ficam todas as áreas do painel. Para cadastrar uma câmera, clique em **Câmeras** (**1**).

## 4. Ver as suas câmeras

![Lista de câmeras](img:primeiros-passos-04-lista)

Aqui aparecem todas as câmeras da sua conta. Para cadastrar uma nova, clique em **Nova câmera** (**1**).

## 5. Preencher os dados da câmera

![Formulário de nova câmera](img:primeiros-passos-05-formulario)

1. Escreva um nome que ajude você a reconhecer a câmera, por exemplo o lugar onde ela fica (**1**).
2. Escolha o plano da câmera (**2**).
3. Clique em **Criar câmera** (**3**).

Os outros campos são opcionais.

## 6. Guardar a chave e o endereço da transmissão

![Câmera criada com a chave e os endereços](img:primeiros-passos-06-criada)

Pronto, a câmera foi criada (**1**). Na caixa abaixo (**2**) estão a **Stream key** (a chave da câmera) e os endereços **RTMP** e **HLS**. Você vai usar o endereço RTMP no equipamento.

## 7. Copiar o endereço RTMP

![Aba Transmissão com a URL RTMP](img:primeiros-passos-07-transmissao)

1. Na lista de câmeras, clique em **Gerenciar** na câmera que você criou.
2. Abra a aba **Transmissão**.
3. Copie a **URL RTMP** (**1**) com o botão **Copiar** (**2**).

## 8. Configurar a câmera no equipamento

Esta parte é feita na própria câmera (ou no aplicativo do fabricante), não no painel:

1. Abra a configuração de rede ou de transmissão da câmera.
2. Procure a opção de transmissão por **RTMP** (em alguns equipamentos aparece como "Servidor RTMP" ou "Push RTMP").
3. Cole a **URL RTMP** que você copiou no campo do endereço do servidor. Ela já contém a chave da sua câmera.
4. No áudio, escolha **G.711A**. Evite **AAC**, porque pode atrasar a abertura do vídeo.
5. Salve a configuração.

**Importante:** use a chave em **um único equipamento**. Para outra câmera, cadastre uma nova câmera no painel: cada equipamento precisa da sua própria chave.

## 9. Conferir se a imagem chegou

![Verificação da transmissão](img:primeiros-passos-08-verificar)

Volte para a aba **Transmissão**. Na área **Verificar transmissão** (**1**), a imagem da câmera deve aparecer (**2**). Depois de configurar a câmera, ela pode levar até **3 minutos** para aparecer. Se passar disso, confira se a URL RTMP foi colada corretamente, se a câmera está ligada e se ela está conectada à internet.
