# Gerenciar: Segurança

A aba **Segurança** decide **quem pode assistir** à sua câmera. Para abri-la, clique em **Gerenciar** na câmera e depois na aba **Segurança**. Nas imagens, os números vermelhos indicam onde você deve olhar ou clicar.

## 1. Público ou privado

![Quadro Privacidade com os botões Público e Privado](img:gerenciar-seguranca-01-publico)

No quadro **Privacidade** você escolhe entre dois modos:

- **Público** (**1**): qualquer pessoa que tenha o link HLS ou o código iframe consegue assistir.
- **Privado** (**2**): só assiste quem você liberar, por site, servidor ou token.

O texto de ajuda (**3**) muda conforme a escolha. O modo atual também aparece no selo do canto direito da tela da câmera.

**Atenção:** ao mudar para **Privado**, o link HLS sem token deixa de funcionar. Se você compartilhou o link com alguém (um parceiro, por exemplo), essa pessoa para de ver a imagem até você liberar o acesso dela, como mostram os próximos itens.

## 2. Os controles do modo Privado

![Os quadros que aparecem ao escolher Privado](img:gerenciar-seguranca-02-privado)

Ao escolher **Privado**, o quadro de privacidade (**1**) continua no alto e aparecem três quadros para liberar o acesso:

- **Domínios autorizados (sites)** (**2**): os sites onde o iframe da câmera pode tocar.
- **IPs / faixas autorizadas (servidores)** (**3**): os servidores que podem assistir pelo link HLS com token.
- **Tokens permanentes (HLS em outros servidores)** (**4**): links com chave de acesso, para usar em outro serviço.

Para voltar ao normal, clique em **Público**. Os controles somem e o link volta a funcionar para qualquer pessoa.

## 3. Liberar o acesso

![Domínio, IP e token liberados](img:gerenciar-seguranca-03-liberar)

1. **Domínio** (**1**): digite o endereço do seu site, por exemplo `exemplo.com.br`, e clique em **Adicionar**. Quando a câmera é privada, o iframe só toca nesses sites.
2. **IP** (**2**): digite o IP do servidor ou uma faixa, por exemplo `203.0.113.4` ou `203.0.113.0/24`, e, se quiser, um rótulo para lembrar de quem é (como "Escritório"). Clique em **Adicionar**. Com a câmera privada, o link HLS por token só funciona desses IPs. Enquanto a lista estiver vazia ("Nenhum IP"), não há restrição de IP.
3. **Token** (**3**): escreva um rótulo (por exemplo, "Servidor A") e clique em **Gerar token**. O painel mostra o link HLS já com a chave de acesso (`?key=...`). Clique em **Copiar** e use esse link no outro serviço.

Cada item tem o botão **Remover**. Ao remover um token, o link dele para de funcionar na hora. Se a câmera for privada e você ainda não tiver nenhum token, o link da foto (aba **Transmissão**) pede que você gere um aqui antes.
