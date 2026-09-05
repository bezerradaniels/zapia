# Guia Prático: Importação do Container no Google Tag Manager (GTM)

Este guia orienta a importação do arquivo `gtm/zapia-gtm-container.json` para o Google Tag Manager, configurando automaticamente todas as tags do GA4, acionadores, variáveis de camada de dados e o evento oficial de **E-commerce (`purchase`)** para assinaturas confirmadas.

---

## 1. Localização do Arquivo de Importação

O arquivo JSON estruturado está disponível na raiz do projeto:
- **`gtm/zapia-gtm-container.json`**

---

## 2. Passo a Passo para Importação no GTM

1. **Acesse o Google Tag Manager:**
   - Faça login em [tagmanager.google.com](https://tagmanager.google.com).
   - Selecione a sua conta e o container da Zapia (`GTM-TXTFF99H` ou o container desejado).

2. **Acesse a área de Administração:**
   - No menu superior, clique na aba **Administrador** (ícone de engrenagem).
   - Na coluna **Contêiner** (lado direito), clique em **Importar contêiner**.

3. **Selecione o arquivo e defina o espaço de trabalho:**
   - Clique em **Escolher arquivo de contêiner** e selecione o arquivo `gtm/zapia-gtm-container.json`.
   - Em **Escolha um espaço de trabalho**, selecione **Existente** e escolha o seu espaço de trabalho padrão (geralmente `Default Workspace`).
   - Em **Selecione uma opção de importação**, escolha **Mesclar** (Merge) e selecione a opção **Renomear tags, acionadores e variáveis conflitantes** (assim você não perde nada do que já tiver criado).

4. **Confira a prévia das alterações:**
   - O GTM mostrará a lista de novas tags, acionadores e variáveis que serão adicionados:
     - Tag: `GA4 - Configuração Principal (Google Tag)`
     - Tag: `GA4 - Evento Purchase (E-commerce de Assinaturas Confirmadas)`
     - Tag: `GA4 - Evento Sign Up (Cadastro de Novo Lojista)`
     - Tag: `GA4 - Evento Begin Checkout (Início de Pagamento do Plano)`
     - Tag: `GA4 - Evento CTA Click (Conversão no Site)`
     - Tag: `GA4 - Evento Order Submitted (Pedido WhatsApp)`
     - Tag: `GA4 - Roteador de Ações da Plataforma`
     - Acionadores e Variáveis de Camada de Dados (`DLV`).
   - Clique no botão azul **Confirmar**.

---

## 3. Configuração do seu ID do Google Analytics (GA4)

Após importar, basta preencher o seu ID do GA4 em um único lugar:

1. No menu lateral esquerdo do GTM, clique em **Variáveis**.
2. Na seção **Variáveis definidas pelo usuário**, localize a variável **`Constant - GA4 Measurement ID`**.
3. Clique nela e substitua o texto `G-XXXXXXXXXX` pelo seu ID de medição real do GA4 (exemplo: `G-ABC123XYZ4`).
4. Clique em **Salvar**.

---

## 4. Publicação das Alterações

1. No canto superior direito do GTM, clique no botão azul **Enviar**.
2. Dê um nome para a versão (exemplo: `Implementação E-commerce e Eventos Zapia`).
3. Clique em **Publicar**.

Pronto! Todas as métricas de faturamento dinâmico de assinaturas confirmadas e eventos de interação do site já começarão a ser computados diretamente nos relatórios de E-commerce e Monetização do Google Analytics 4.
