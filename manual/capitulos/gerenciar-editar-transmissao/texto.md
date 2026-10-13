# Gerenciar: Editar e Transmissão

Na lista de **Câmeras**, o botão **Gerenciar** abre a tela da câmera. No alto ficam o nome e o código da câmera e, no canto direito, o selo **Público** ou **Privado** (explicado no capítulo **Gerenciar: Segurança**). Logo abaixo há sete abas: **Editar**, **Transmissão**, **Segurança**, **Localização**, **Monitoramento**, **Cartões** e **Integração**.

Este capítulo explica as duas primeiras. Nas imagens, os números vermelhos indicam onde você deve olhar ou clicar.

## 1. A aba Editar

![Aba Editar com os dados da câmera](img:gerenciar-editar-transmissao-01-editar)

As abas ficam no alto da tela (**1**) e o selo de privacidade no canto (**2**). Na aba **Editar** você muda os dados da câmera:

- **Nome** (**3**): é obrigatório. Use um nome que ajude a reconhecer a câmera, por exemplo o lugar onde ela fica. **Marca**, **Cloud** e **Projeto/Cliente** são opcionais e servem para organizar e buscar na lista.
- **Qualidade contratada** (**4**): 1080p ou inferior (15 fps), 2K / QHD (30 fps) ou 4K / UHD (30 fps). Qualidades acima de 1080p têm custo adicional. Cobramos pelo que a câmera realmente envia: se houver diferença entre o contratado e o enviado, você é avisado para ajustar.
- **Câmera ativa** (**5**): desmarque para desativar a câmera. Ela passa a aparecer como **Inativa** na lista.

Depois de mudar, clique em **Salvar** (**6**). Aparece a mensagem **Alterações salvas**. O botão **Salvar** só aparece para quem tem permissão de editar câmeras.

A localização da câmera fica na aba **Localização**, e a chave do YouTube na aba **Transmissão**.

## 2. A aba Transmissão: imagem e YouTube

![Aba Transmissão com a imagem ao vivo e a retransmissão para o YouTube](img:gerenciar-editar-transmissao-02-verificar-youtube)

A aba **Transmissão** reúne tudo o que sai da câmera. Em cima, à esquerda, fica a janela **Verificar transmissão** (**1**), que mostra a imagem ao vivo. Se a imagem aparecer, a câmera está enviando para o servidor. Depois de configurar a câmera, a imagem pode levar até **3 minutos** para aparecer.

À direita fica a **Retransmissão YouTube** (planos Pro e Premium), que envia a imagem da câmera para uma transmissão ao vivo no seu canal:

1. No YouTube Studio, abra **Transmitir** e junte a "URL do servidor" com a "chave de transmissão", no formato `rtmp://.../live2/sua-chave`.
2. Cole esse endereço no campo (**2**) e clique em **Salvar**.
3. Use os botões (**3**): **Iniciar** começa a retransmissão, **Parar** encerra e **Reiniciar** aplica mudanças feitas na câmera (áudio, qualidade). Ao reiniciar, a transmissão no YouTube fica fora do ar por cerca de 15 segundos.

O selo no canto do quadro mostra se a retransmissão está **No ar** ou **Parado**. O botão **Iniciar** só funciona depois que a URL do YouTube estiver salva.

Se a câmera faz parte de um **grupo de transmissão**, é o grupo que controla a transmissão dela no YouTube, e a retransmissão solo fica bloqueada. O painel avisa isso em amarelo.

No plano Básico, o quadro do YouTube aparece com um cadeado: **Retransmissão para o YouTube não está incluída no seu plano atual**.

## 3. URL RTMP e link da foto

![URL RTMP e link da foto](img:gerenciar-editar-transmissao-03-rtmp-foto)

O quadro **Transmissão (RTMP)** (**1**) mostra a **URL RTMP** da câmera, que você copia com o botão **Copiar** e cola na configuração do equipamento. O passo a passo está no capítulo **Primeiros passos**. A chave da câmera já vai dentro da URL. Use essa URL em **um único equipamento**; para outra câmera, cadastre uma nova câmera. Na câmera, escolha o áudio **G.711A** e evite **AAC**, que pode atrasar a abertura do vídeo.

O quadro **Link da foto (time-lapse)** (**2**), dos planos Pro e Premium, mostra um link que sempre devolve a última foto da câmera, atualizada a cada 15 minutos. Use esse link no seu site ou para montar um time-lapse. Se a câmera for privada, o link já inclui um token de acesso (veja o capítulo **Gerenciar: Segurança**).

## 4. Áudio, link HLS e iframe

![Áudio, link HLS e iframe](img:gerenciar-editar-transmissao-04-audio-player)

- **Áudio da transmissão** (**1**), planos Pro e Premium: sem áudio, a transmissão vai com som silencioso. Clique em **Enviar áudio (.mp3)** para tocar um arquivo em repetição. Depois de enviado, aparecem os botões **Trocar áudio** e **Remover**. Se a retransmissão para o YouTube estiver no ar, ela reinicia sozinha para aplicar a mudança.
- **URL HLS pública** (**2**): o endereço para tocar a câmera em players e aplicativos. Copie com o botão **Copiar**. Em câmera pública, o link funciona direto. Em câmera privada, só funciona com token e de um IP autorizado.
- **Incorporar no site (iframe)** (**3**), planos Pro e Premium: o código para colocar o player da câmera dentro de uma página do seu site. Copie e cole no HTML da página. A chave real da câmera nunca aparece, só um identificador público.

No plano Básico, o áudio e o iframe aparecem com cadeado.
