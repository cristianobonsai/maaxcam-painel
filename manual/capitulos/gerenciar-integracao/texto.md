# Gerenciar: Integração

A aba **Integração** liga a câmera à **Carbigdata**: a cada evento de detecção de veículo (a "linha virtual" da câmera), a câmera envia uma foto para a Carbigdata. Use esta aba **somente se você contratou o serviço com a Carbigdata**. É ela quem fornece o **Device ID** e a **chave de API** que você vai informar aqui. Outras integrações poderão aparecer nesta aba no futuro.

Para abrir, clique em **Gerenciar** na câmera e depois em **Integração**. Nas imagens, os números vermelhos indicam onde você deve olhar ou clicar.

## 1. Ativar e escolher o tipo

![Chave de ativação, tipo de reconhecimento e credenciais](img:gerenciar-integracao-01-ativar)

1. **Chave de ativação** (**1**): liga e desliga a integração desta câmera.
2. **Tipo de reconhecimento** (**2**): como as fotos chegam à Carbigdata.
   - **Interno (LiveByBit):** a câmera manda as fotos por **SFTP** para o LiveByBit, e o LiveByBit reenvia para a Carbigdata.
   - **Externo (Carbigdata):** a própria câmera envia direto para a Carbigdata, por **webhook**. Não usa SFTP.
3. **Credenciais** (**3**): escolha o ambiente, **Sandbox** (de testes) ou **Produção**, e preencha o **Device ID** e a **Chave de API** desse ambiente. Dois selos mostram se cada ambiente está configurado. A chave fica guardada e não aparece de novo: para trocá-la, digite a nova (o botão **Mostrar** revela o que você está digitando). Valide as fotos em **Sandbox** antes de passar para **Produção**; o cadastro de produção é feito separadamente na Carbigdata, depois da validação.

No fim da tela, o botão **Salvar** grava tudo e mostra **Alterações salvas**. Ele só aparece para quem tem permissão de editar câmeras.

## 2. Modo Interno: conexão SFTP

![Dados de conexão SFTP para colar na câmera](img:gerenciar-integracao-02-sftp)

No modo Interno, o quadro **Conexão SFTP** (**1**) mostra o **Host / Porta**, o **Usuário** e a **Senha** da câmera. Eles são gerados sozinhos na primeira vez que você salva com a integração ativada. Copie cada um com o botão **Copiar** e cole no menu **Local → FTP** da câmera.

## 3. Janela de envio e status

![Janela de envio e status do último envio](img:gerenciar-integracao-03-janela-status)

- **Janela de envio** (**1**), no modo Interno: define em que horário a câmera envia as fotos. **24 horas**, **Comercial** (das 07:00 às 18:30) ou **Manual**, em que você escolhe o início e o fim. A barra mostra, em azul, o período escolhido sobre as 24 horas do dia. Fora da janela, as fotos não são enviadas.
- **Status** (**2**): mostra o **último envio** e o resultado: **OK**, **Erro** ou **Pulado (fora do horário)**.

Logo abaixo, o quadro **Capturas recebidas** lista as fotos mais recentes, com filtros **Todas**, **Enviadas**, **Erro** e **Fora do horário**. As fotos enviadas com sucesso são apagadas logo depois do envio, então essa lista costuma ficar vazia. As que deram erro ficam guardadas por cerca de 1 hora, para você conferir.

## 4. Modo Externo: modelo e webhook

![Modelo de câmera e campos do webhook](img:gerenciar-integracao-04-externo-webhook)

No modo Externo, a configuração é feita no menu de eventos (webhook) da própria câmera:

1. **Modelo de câmera homologado** (**1**): escolha o modelo da sua câmera. Só aparecem os modelos já validados.
2. **Webhook** (**2**): o painel mostra os campos com os **mesmos nomes** do menu da câmera: **Host IP Address/Domain Name**, **Host Port**, **Version** e **Host URL**. Copie cada um com o botão **Copiar** e cole no campo de mesmo nome. Os outros campos da câmera ficam assim: **Authentication Mode** = None, **Upload Binary Image** = habilitado e **Output Binary Image in BMP Format** = habilitado.

O endereço do webhook só aparece depois que você salva com o modo Externo ativado.

## 5. Vínculo de segurança

![Câmera vinculada e botão de reset](img:gerenciar-integracao-05-externo-vinculo)

No modo Externo, o **Vínculo de segurança** (**1**) prende a chave à câmera física que a usar primeiro, para que o mesmo cadastro não seja reaproveitado em outro endereço:

- Enquanto nenhuma foto chegou, aparece **Aguardando primeira captura**. O endereço de rede (MAC) da câmera é travado automaticamente na primeira detecção.
- Depois, aparece **Câmera vinculada**, com o MAC e o **endereço cadastrado** (o da aba **Localização**).
- Se você precisar **trocar o equipamento** (defeito, queima, manutenção), use **Resetar vínculo da câmera**. O painel mostra o endereço cadastrado e avisa que a nova câmera precisa ser instalada **exatamente nesse mesmo endereço**, senão as fotos serão enviadas para o lugar errado dentro da Carbigdata. Para confirmar, marque a caixa **Confirmo que a câmera será instalada neste mesmo endereço** e clique em **Confirmar reset**.
