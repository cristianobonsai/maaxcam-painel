# Notificações

Em **Notificações** você escolhe **como e quando** quer ser avisado quando uma câmera cai ou volta. Os avisos podem chegar pelo **Telegram** e por **e-mail**. Nas imagens, os números vermelhos indicam onde você deve olhar ou clicar.

A tela tem duas abas: **Minhas notificações** (os seus avisos) e **Convidados** (os avisos das pessoas que você convidou; veja o item 6).

## 1. Conectar o Telegram

![Quadro do Telegram desconectado com o botão Conectar Telegram](img:notificacoes-01-telegram)

O quadro **Telegram** (**1**) mostra se o robô do LiveByBit já está ligado ao seu Telegram. Quando aparece **Desconectado**, clique em **Conectar Telegram** (**2**).

## 2. Abrir o link no Telegram

![Link para abrir no Telegram, código de conexão e botão Já conectei](img:notificacoes-02-telegram-link)

O painel gera um link só para você:

1. Clique em **Abrir no Telegram** (**1**). O Telegram abre o robô. Toque em **Iniciar** (Start).
2. Se o link não abrir, envie ao robô a mensagem que aparece no painel (**2**), no formato `/conectar CÓDIGO`.
3. De volta ao painel, clique em **Já conectei — atualizar** (**3**).

## 3. Telegram conectado e e-mail

![Telegram conectado e quadro de alertas por e-mail ligado](img:notificacoes-03-telegram-ok)

Quando a conexão dá certo, o selo muda para **Conectado** (**1**) e aparece a mensagem "Notificações ativas. Você receberá mensagens diretamente no seu Telegram."

- **Desconectar** (**2**) desfaz a ligação com o Telegram. Você pode conectar de novo quando quiser.
- **Enviar mensagem de teste** (**3**) manda um aviso de teste para o seu Telegram. Use para conferir se está tudo certo.
- No quadro **E-mail** (**4**), ligue **Receber alertas por e-mail** para receber os avisos também por e-mail. Você pode informar um **e-mail de destino**. Se deixar vazio, o painel usa o e-mail da sua conta.

## 4. Tipos de alerta

![Lista de tipos de alerta com o Resumo Diário ligado](img:notificacoes-04-tipos)

Em **Tipos de Alerta** (**1**) você liga ou desliga cada aviso:

- **Câmera Offline**: avisa quando uma câmera para de transmitir.
- **Câmera Restaurada**: avisa quando a câmera volta a transmitir depois de uma queda.
- **Bitrate Crítico**: aparece como **Em breve**. Ainda não está disponível.
- **Resumo Diário** (**2**): envia todo dia um relatório de disponibilidade de todas as câmeras. Na imagem, ele foi ligado.

## 5. Configurações avançadas

![Configurações avançadas com tempo de espera, horário de silêncio e horário do resumo](img:notificacoes-05-avancadas)

Em **Configurações Avançadas** você ajusta o jeito de avisar:

1. **Câmera offline — alertar após** (**1**): o painel só avisa se a câmera ficar offline por esse tempo (de 1 a 60 minutos). Isso evita alarme falso quando a câmera apenas oscila por alguns instantes.
2. **2º alerta se continuar offline**: reenvia um aviso se a câmera seguir offline depois de um tempo que você escolhe (de 1 a 12 horas). Vem **Desligado**.
3. **Horário de silêncio** (**2**): liga um período do dia em que **os avisos de câmera não são enviados na hora**, por exemplo das 22:00 às 07:00. Ao ligar, aparecem os campos de início e de fim. Quando o período termina, você recebe **um único resumo** com o que aconteceu enquanto estava em silêncio (veja o item 8). A única exceção é o aviso de **chave em uso por dois equipamentos**, que chega na hora.
4. **Horário do resumo diário** (**3**): a hora em que o Resumo Diário chega. Esse campo só aparece com o **Resumo Diário** ligado.

Depois de ajustar, clique em **Salvar Configurações** (**4**). Se você não salvar, as mudanças não valem.

## 6. Alertas para convidados

![Aba Convidados com o atalho por grupo](img:notificacoes-06-convidados)

A aba **Convidados** aparece só para o **dono da conta**. Nela você escolhe **quais convidados também recebem os avisos de câmera** (queda e retorno) e por quais canais (**1**). Quem você convida e quais câmeras cada um enxerga é definido na tela **Usuários**.

O **Atalho por grupo** (**2**) aplica a escolha de uma vez a todos os membros de um grupo de acesso: escolha o grupo, marque **Email** e/ou **Telegram** e clique em **Aplicar**. Quem entrar no grupo depois precisa do atalho de novo.

## 7. Escolher canais e câmeras de cada convidado

![Cartão de um convidado com canais, grupos de acesso e câmeras avulsas](img:notificacoes-07-convidado-opcoes)

Cada convidado tem um cartão:

1. A **chave** (**1**) liga ou desliga os avisos para esse convidado.
2. **Email** e **Telegram** (**2**): marque por onde ele recebe. Para receber pelo Telegram, o convidado precisa ter conectado o Telegram dele. Se não tiver, o painel mostra um aviso.
3. **Grupos de acesso** (**3**): marque os grupos de câmeras dos quais ele recebe avisos. Use a busca se tiver muitos.
4. **Câmeras avulsas** (**4**): marque câmeras específicas, além dos grupos.
5. Clique em **Salvar** (**5**) no cartão desse convidado. Aparece "✓ Salvo".

## 8. Como são os avisos

Cada aviso conta o que aconteceu com números reais da câmera, e não só "a câmera caiu":

- **Câmera sem sinal:** diz desde que horas a câmera está sem enviar imagem, há quantos minutos, quantas quedas ela teve nas últimas 24 horas e **o que conferir** (por exemplo energia e internet do local).
- **Câmera continua sem sinal:** é o **2º alerta** (item 5), com há quanto tempo a câmera está fora.
- **Câmera voltou:** diz quanto tempo ela ficou sem imagem e entre que horas. Só chega se você recebeu o aviso de que ela tinha caído.
- **Conexão oscilando:** chega quando a câmera cai várias vezes (3 vezes em 30 minutos ou 6 vezes em 24 horas). Normalmente é o roteador, o cabo ou o provedor do local. Quando a conexão fica **30 minutos sem queda**, chega o aviso **Conexão estável**.
- **Várias câmeras juntas:** se várias câmeras do mesmo local ficarem sem sinal ao mesmo tempo, você recebe **uma mensagem só**, com o nome de todas.
- **Resumo do período de silêncio:** ao fim do horário de silêncio, uma mensagem diz quais câmeras tiveram queda e já voltaram e quais seguem sem sinal.

Para você não ser incomodado à toa, o painel também faz o seguinte:

- Quando **várias câmeras de clientes diferentes** ficam sem sinal no mesmo minuto, esperamos **10 minutos** antes de avisar. Só quem continuar sem sinal recebe o aviso.
- Cada câmera envia no máximo **3 avisos** e cada conta no máximo **6 avisos** a cada 24 horas. Nessa conta não entram "voltou", "2º alerta", "conexão estável" e os resumos. Passando do limite, chega uma mensagem **Avisos pausados**, e o histórico da câmera continua no painel (aba **Monitoramento**).
- O mesmo tipo de aviso da mesma câmera não se repete em menos de **6 horas**.

## 9. Silenciar os avisos de uma câmera

Nas mensagens de **sem sinal**, **continua sem sinal** e **conexão oscilando**, o Telegram e o e-mail trazem botões para o dono da conta:

- **Ver câmera:** abre a câmera no painel.
- **Silenciar 7 dias:** para os avisos dessa câmera por 7 dias.
- **Não avisar mais desta câmera:** para os avisos dessa câmera até você reativar.

Ao tocar em um botão de silenciar, abre uma página pedindo que você **confirme**. Nada muda antes de você confirmar, e a mesma página tem a opção de **desfazer**. Você também pode silenciar e reativar pelo painel, em **Gerenciar → Monitoramento** (veja o capítulo **Gerenciar: Monitoramento**).

**Silenciar vale só para os avisos.** O estado e o histórico da câmera continuam no painel. Os convidados recebem os mesmos avisos, mas **sem os botões de silenciar**.

## 10. Resumo semanal de uma câmera que oscila

Se uma câmera fica **sem sinal várias vezes por semana**, passamos a acompanhá-la de perto e o dono da conta recebe uma mensagem acolhedora, por **e-mail** (sempre, no e-mail da conta) e pelos canais que você configurou aqui. Ela chega **no máximo uma vez por dia**, junta todas as câmeras da conta em uma só mensagem e o resumo semanal sai na **segunda-feira, às 10h**, respeitando o seu **horário de silêncio**. A mensagem traz quantas vezes a câmera ficou sem sinal, em quantos dos 7 dias, o horário mais comum e o que costuma resolver. Quando a câmera estabiliza, avisamos também.

Para parar de receber o resumo de uma câmera, use o botão **Parar de receber o resumo desta câmera** na própria mensagem (abre uma página para confirmar, com a opção de desfazer) ou o botão na aba **Monitoramento** da câmera (veja o capítulo **Gerenciar: Monitoramento**). **Parar o resumo não desliga os avisos de queda**, que seguem como você configurou. Os convidados não recebem esse resumo.
