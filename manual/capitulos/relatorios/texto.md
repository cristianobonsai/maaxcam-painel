# Relatórios

Em **Relatórios** você acompanha como as suas câmeras se comportaram: **quanto tempo ficaram no ar**, **quando caíram** e **quem acessou o painel**. Nas imagens, os números vermelhos indicam onde você deve olhar ou clicar.

A tela tem até três abas: **Disponibilidade**, **Quedas** e **Acessos**. Você só vê as abas que a sua conta tem permissão para consultar.

## 1. Disponibilidade

![Relatório de disponibilidade com as abas, a conferência de SLA e as barras por câmera](img:relatorios-01-disponibilidade)

A aba **Disponibilidade** (**1**) mostra, para cada câmera (**3**), a **porcentagem do tempo em que ela esteve online** na última semana, com as horas online e offline. A barra muda de cor conforme o resultado:

- **verde**: 95% ou mais;
- **amarelo**: de 80% a menos de 95%;
- **vermelho**: abaixo de 80%.

Use o campo **Buscar câmera** para achar uma câmera pelo nome. Abaixo da busca, o painel informa desde quando os dados foram coletados: a disponibilidade só é calculada com o período em que o painel já acompanha a câmera.

No alto fica a **Conferência de SLA por período** (**2**), explicada no próximo item.

## 2. Conferir o SLA por período

![Conferência de SLA com a tabela da maior queda contínua de cada câmera](img:relatorios-02-sla-periodo)

**SLA** é o limite de tempo parado que você aceita. Aqui você confere se alguma câmera passou desse limite num período:

1. Escolha a **Data início** e a **Data fim**.
2. Em **SLA (dias de tolerância)** (**1**), informe quantos dias seguidos de queda são aceitáveis. Por exemplo, **4**.
3. Clique em **Consultar**.

O painel mostra uma tabela (**2**) com a **maior queda contínua** de cada câmera no período. Ele compara essa maior queda, de uma vez só, com o limite que você definiu, e **não** a soma de todas as quedas. A coluna **SLA** diz **Dentro do limite** ou **Extrapolou o SLA**, e a linha fica destacada em vermelho quando extrapola.

Para guardar o resultado, use **Exportar PDF** (**3**) ou **Exportar Excel**.

## 3. Relatório de Quedas

![Relatório de quedas com o ranking de câmeras e a lista de quedas de uma câmera](img:relatorios-03-quedas)

A aba **Quedas** mostra quantas vezes cada câmera caiu na última semana. No alto, o painel informa o **total de quedas** (**1**) e lembra que o histórico fica disponível por até **180 dias**.

A tabela traz a câmera, a **quantidade de quedas** e a **data da última queda**. **Clique numa câmera** (**2**) para abrir a lista de todas as quedas dela (**3**), com dia e hora. Clique de novo para fechar.

## 4. Quedas de uma câmera em um período

![Consulta de período com o tempo total offline e a tabela de quedas](img:relatorios-04-quedas-periodo)

Para olhar um período específico, use **Consultar período específico**, no alto da aba:

1. Escolha a **câmera** (**1**) e as datas de início e fim.
2. Clique em **Consultar**.

O painel mostra um resumo (**2**) com o **tempo total que a câmera ficou offline** e quantas quedas houve. Logo abaixo, a tabela (**3**) lista cada queda com **quando caiu**, **quando voltou** e a **duração**. Também é possível **Exportar PDF** e **Exportar Excel** dessa consulta.

## 5. Relatório de Acessos

![Relatório de acessos com a consulta de período e a lista de acessos](img:relatorios-05-acessos)

A aba **Acessos** mostra **quem entrou no painel**: o usuário, o **IP** de onde entrou e **quando**. É útil para conferir se ninguém estranho acessou a sua conta.

- A consulta de período (**1**) funciona como a das quedas: escolha as datas, clique em **Consultar** e, se quiser, exporte em PDF ou Excel.
- A busca (**2**) filtra a lista por usuário.
- A lista (**3**) mostra os acessos da última semana, do mais recente para o mais antigo.
