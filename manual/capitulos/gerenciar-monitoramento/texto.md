# Gerenciar: Monitoramento

A aba **Monitoramento** mostra como a câmera está **agora**. Ela se atualiza sozinha a cada 20 segundos, sem precisar recarregar a página. Para abri-la, clique em **Gerenciar** na câmera e depois em **Monitoramento**. Nas imagens, os números vermelhos indicam onde você deve olhar.

## 1. Estado e números da transmissão

![Estado da câmera e números da transmissão](img:gerenciar-monitoramento-01-estado)

O quadro **Estado da câmera** (**1**) tem uma linha para cada ponto importante. Uma bolinha verde quer dizer que está tudo certo:

- **Tipo / saída:** como a câmera é entregue: **HLS direto**, **YouTube** ou **Grupo**.
- **Conexão com o servidor:** **Conectada** (a câmera está enviando imagem) ou **Sem sinal** (não está).
- **Estabilidade (24h):** **Estável** ou **Instável**, com o número de quedas nas últimas 24 horas.
- **Saída:** onde a imagem está indo: **Publicando (HLS)**, **No ar (YouTube)**, **No grupo** ou **Relay desligado**.
- **Ajustes (configuração):** **OK** ou **Precisa ajustar**.

O quadro **Números da transmissão** (**2**) mostra o que o servidor mede: **Resolução**, **FPS** (quadros por segundo), **Bitrate**, **Keyframe** (intervalo entre quadros-chave, o ideal é cerca de 2 segundos), **Quedas (24h)** e **Codec**. A resolução e o FPS são lidos da câmera; o bitrate e o keyframe são medidos no servidor.

Se a linha **Conexão** mostrar **Sem sinal**, confira se a câmera está ligada, conectada à internet e com a URL RTMP e a chave corretas (aba **Transmissão**).

## 2. Quando há um problema

![Câmera instável e precisando de ajuste](img:gerenciar-monitoramento-02-problemas)

Quando algo foge do normal, a bolinha muda de cor e o painel explica:

- **Estabilidade** (**1**): **Instável** quer dizer que a câmera caiu várias vezes nas últimas 24 horas. Confira a energia, o cabo ou o Wi-Fi e a internet do local.
- **Ajustes** (**2**): **Precisa ajustar** quer dizer que a configuração da câmera pode melhorar.
- O aviso laranja (**3**) diz o motivo e o que fazer. Por exemplo: "Diminua o I-Frame/GOP da câmera (ideal ~2s) e, se necessário, ajuste o bitrate." Essa configuração é feita no menu da própria câmera (ou no aplicativo do fabricante).

## 3. Chave em uso por dois equipamentos

![Aviso de chave RTMP usada por dois equipamentos](img:gerenciar-monitoramento-03-chave-duplicada)

Cada câmera tem a sua chave, e cada chave deve ser usada em **um único equipamento**. Se um segundo equipamento tentar transmitir com a mesma chave, acontece o seguinte:

- A linha **Conexão** (**1**) mostra **Chave em uso por dois equipamentos**.
- O aviso laranja (**2**) mostra o endereço (IP) do equipamento bloqueado, desde quando ele tenta e quantas tentativas foram bloqueadas. O IP só aparece para o dono da conta.
- **Bloqueamos o segundo equipamento e a transmissão original segue no ar.** Nada cai.

O que fazer: se o segundo equipamento é uma **câmera nova**, cadastre-a em **Câmeras → Nova câmera**, para ela ter a própria chave. Se foi engano, desligue ou reconfigure o equipamento duplicado. O dono da conta também recebe um aviso pelos canais configurados em **Notificações**.
