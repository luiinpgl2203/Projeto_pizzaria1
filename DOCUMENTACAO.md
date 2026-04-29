# Documentação Funcional - Sistema de Controle de Estoque (Pizzaria)

Este documento descreve as funcionalidades e os processos operacionais do sistema de controle de estoque desenvolvido em React com persistência Firebase.

---

## 1. Visão Geral do Sistema
O sistema foi projetado para gestão multi-pizzarias (multi-tenant), permitindo que diferentes unidades compartilhem a mesma infraestrutura, mantendo seus dados (ingredientes, receitas, produtos) totalmente isolados e seguros.

### Tecnologias Principais:
- **Frontend**: React + Tailwind CSS
- **Banco de Dados**: Firebase Firestore (NoSQL)
- **Autenticação**: Firebase Auth (Login Google e E-mail)

---

## 2. Funcionalidades Principais

### 2.1 Dashboard de Estoque
Exibe métricas críticas para tomada de decisão rápida:
- **Ingredientes em Alerta**: Lista itens que estão abaixo do estoque mínimo configurado.
- **Gráfico de Status**: Visualização proproccional do estoque atual vs. mínimo.
- **Consumo Estimado**: Projeção baseada em dados históricos ou cadastrados.

### 2.2 Controle de Inventário (Estoque)
Módulo central para gestão de insumos:
- **Ajuste de Estoque**: Permite atualizar a quantidade física de um ingrediente no banco de dados.
- **Configuração de Mínimos**: Definição da "linha de segurança" para cada insumo.
- **Conversão de Unidades**: Suporte automático para conversão entre (g, kg, ml, L).
- **Custo Médio**: Cálculo do valor investido por ingrediente.

### 2.3 Gestão de Cardápio e Receitas
Define a inteligência da baixa automática:
- **Cadastro de Receitas**: Para cada produto (ex: Pizza Calabresa), define-se os ingredientes e quantidades (ex: 200g de queijo, 100g de calabresa).
- **Vínculo Comercial**: Associa o custo de produção ao preço de venda para cálculo de margem.

### 2.4 Localizador de Fornecedores
Integrado com IA (Gemini), auxilia na reposição de estoque:
- Identifica itens em falta e sugere fornecedores próximos ou conhecidos para agilizar a compra.

---

## 3. Passo a Passo de Cadastro Operacional

Siga esta ordem para garantir a integridade dos dados no sistema:

### Passo 1: Cadastro de Ingredientes
1. Acesse o módulo **"Estoque"**.
2. Clique em **"Novo Ingrediente"** (em desenvolvimento) ou utilize a lista para ajustar os existentes.
3. Defina o Nome, Unidade de Medida (ex: kg), Estoque Atual e Estoque Mínimo.
4. Informe o **Custo por Unidade** para que o sistema consiga calcular a margem de lucro posteriormente.

### Passo 2: Cadastro de Produtos (Cardápio)
1. Acesse o módulo **"Cardápio"**.
2. Cadastre o item final que será vendido (ex: Pizza Grande).
3. Informe o preço de venda sugerido ao público.

### Passo 3: Montagem da Receita (Ficha Técnica)
1. Ainda no módulo **"Cardápio"**, localize o produto e clique em **"Editar Receita"**.
2. Adicione os ingredientes cadastrados no Passo 1.
3. Informe a quantidade exata utilizada na produção de **uma unidade** desse produto.
4. O sistema calculará automaticamente o custo de produção total com base no custo dos ingredientes.

### Passo 4: Operação Diária
1. Sempre que houver uma compra, atualize o saldo no módulo de **"Estoque"**.
2. Futuramente, ao registrar um pedido no sistema, a baixa dos ingredientes será automática baseada na ficha técnica (passo 3).

---

## 4. Estrutura de Segurança e Multi-Tenancy

- **Isolamento**: Os dados de uma pizzaria não podem ser lidos por outra.
- **Hierarquia de Papéis**:
  - **Admin/Gerente**: Pode alterar estoques, custos e receitas.
  - **Cozinha**: Apenas visualiza estoque e receitas.
- **Login**: O acesso é validado via Google. No primeiro login, seu e-mail é vinculado a uma unidade específica no banco de dados.

---
**Nota de Manutenção**: Desenvolvedores devem consultar o arquivo `App.tsx` na seção `FIREBASE SYNC` para detalhes sobre a implementação de subcoleções.
