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
- **Avisos desta câmera:** **Ligados** ou **Silenciados** (veja o item 4).

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

## 4. Avisos desta câmera: silenciar e reativar

![Linha Avisos desta câmera com os botões para silenciar](img:gerenciar-monitoramento-04-avisos)

A linha **Avisos desta câmera** (**1**) diz se os avisos dessa câmera (sem sinal, voltou, conexão oscilando) estão **Ligados**. Se você não quer receber os avisos de uma câmera específica, por exemplo uma câmera de teste, use os botões:

- **Silenciar 7 dias** (**2**): para de avisar por 7 dias e depois volta sozinho.
- **Não avisar mais** (**3**): para de avisar até você reativar.

Esses botões aparecem para o dono da conta e para os convidados com permissão de editar as notificações. Os outros veem só o estado.

![Linha Avisos desta câmera mostrando Silenciados e o botão Reativar](img:gerenciar-monitoramento-05-avisos-silenciados)

Com os avisos silenciados, a linha mostra **Silenciados até** a data (**1**), ou **Silenciados** quando for sem prazo. Para voltar a receber, clique em **Reativar** (**2**).

**Silenciar vale só para os avisos.** O estado da câmera e o histórico continuam aparecendo normalmente aqui na aba. Você também pode silenciar direto na mensagem de aviso, pelos botões que chegam no Telegram e no e-mail (veja o capítulo **Notificações**).

## 5. Quando estamos acompanhando a câmera

![Faixa azul "Estamos acompanhando esta câmera" e o resumo semanal](img:gerenciar-monitoramento-06-acompanhando)

Quando uma câmera fica **sem sinal várias vezes por semana**, nós passamos a acompanhá-la de perto. Na aba aparece a faixa azul **Estamos acompanhando esta câmera** (**2**), que mostra quantas vezes ela ficou sem sinal na última semana, em quantos dos 7 dias, e uma lista do que costuma resolver: conferir o roteador e o cabo de rede, trocar o Wi-Fi por cabo, ver se a internet do local cai nesses horários e atualizar o firmware do equipamento.

Junto vem a linha **Resumo semanal desta câmera** (**1**). Toda **segunda-feira, às 10h**, o dono da conta recebe um resumo curto, por e-mail e pelos canais que estiverem configurados em **Notificações**, com os números da semana e as mesmas dicas. Se preferir não receber o resumo de uma câmera, clique em **Parar de receber o resumo semanal** (**3**). O botão passa a dizer **Receber o resumo semanal**, para você voltar a receber quando quiser. Também dá para parar direto pelo botão que vem na própria mensagem.

**Parar o resumo não desliga os avisos de queda:** eles continuam como você configurou em **Notificações**. O botão aparece para o dono da conta e para os convidados com permissão de editar as notificações. Quando a câmera ficar **7 dias seguidos estável**, a faixa some sozinha e enviamos uma mensagem avisando. Se quiser ajuda para olhar a câmera, fale com o nosso suporte.

## 6. Modo econômico

![Aviso do modo econômico](img:gerenciar-monitoramento-07-modo-economico)

Se a câmera segue oscilando por muitas semanas, para manter o serviço estável para você e para os outros clientes **reduzimos temporariamente** a frequência da foto automática e dos reinícios da transmissão para o YouTube dessa câmera (**1**). **A imagem e o link seguem funcionando normalmente.** Quando ela ficar **7 dias estável**, tudo volta ao normal sozinho, sem você precisar pedir nada.
