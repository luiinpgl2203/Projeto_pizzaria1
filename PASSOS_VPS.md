# Guia de Deploy na VPS Hostinger (Ubuntu/Debian) 🚀

Este guia detalha como subir o sistema da Pizzaria Funchal na sua VPS Hostinger, mantendo o banco de dados no Firebase.

## 1. Preparação da VPS

Acesse sua VPS via SSH:
```bash
ssh root@SEU_IP_AQUI
```

Atualize o sistema e instale o Node.js (versão 20+ recomendada):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. Clonando o Projeto

Você pode usar o Git para subir seu código:
```bash
cd /var/www
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git pizzaria-funchal
cd pizzaria-funchal
```

## 3. Instalação e Build

Instale as dependências e gere a pasta de produção (`dist`):
```bash
npm install
npm run build
```

## 4. Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto na VPS:
```bash
nano .env
```
Adicione sua chave do Gemini:
```env
GEMINI_API_KEY=sua_chave_aqui
NODE_ENV=production
```

## 5. Gerenciamento de Processo (PM2)

O PM2 garante que o servidor reinicie sozinho se cair:
```bash
npm install -g pm2
pm2 start server.ts --name "funchal-app" --interpreter ./node_modules/.bin/tsx
pm2 save
pm2 startup
```

## 6. Configuração do Nginx (Servidor Web)

Instale o Nginx:
```bash
sudo apt install nginx
```

Configure o Proxy Reverso:
```bash
sudo nano /etc/nginx/sites-available/pizzaria-funchal
```

Cole a configuração abaixo:
```nginx
server {
    listen 80;
    server_name seu-dominio.com; # Ou o IP da VPS

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative a configuração e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/pizzaria-funchal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Observações Importantes:
- **Firebase**: O banco de dados continuará funcionando normalmente pois as credenciais estão no arquivo `firebase-applet-config.json` que vai junto com o código. Certifique-se de que o URL do iFrame ou o domínio da sua VPS esteja adicionado aos "Domínios Autorizados" no Console do Firebase (Authentication > Settings).
- **SSL (HTTPS)**: Recomendo usar o `certbot` para instalar o SSL gratuitamente:
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx
  ```
