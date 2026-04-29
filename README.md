# Pizzaria Funchal - Plataforma de Gestão 🍕

Uma plataforma full-stack completa para gerenciamento de pizzarias, focada em eficiência operacional, controle de estoque inteligente e análise de custos com IA.

## 🚀 Funcionalidades

- **Dashboard Real-time**: Métricas de vendas, pedidos e lucratividade.
- **Gestão de Estoque**: Controle multi-unidade com alertas de estoque mínimo e custo médio.
- **Inteligência Artificial (Gemini)**: Análise automática de cardápios e notas fiscais.
- **KDS (Kitchen Display System)**: Gerenciamento de pedidos na cozinha em tempo real.
- **Financeiro & Fiscal**: Controle de caixa, custos fixos e NF-e.
- **Logística**: Mapa de entregas e dashboard para motoboys.

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion (animações).
- **Backend/Database**: Firebase (Firestore, Auth), Express.
- **IA**: Google Gemini API.
- **Gráficos**: Recharts / D3.

## 📦 Instalação e Desenvolvimento

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/pizzaria-funchal.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`.
   - Adicione sua `GEMINI_API_KEY`.
4. Configure o Firebase:
   - Substitua as credenciais no arquivo `firebase-applet-config.json`.
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🌐 Deploy na VPS (Hostinger/Ubuntu)

1. **Requisitos**: Node.js 20+, Nginx.
2. **Build**:
   ```bash
   npm run build
   ```
3. **Nginx Config**:
   Aponte a raiz (root) do seu servidor para a pasta `/dist` gerada no build.
4. **Firebase**: Como o banco está no Firebase, não é necessário rodar um banco de dados local na VPS.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

*Desenvolvido para Pizzaria Funchal.*
