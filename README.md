# MaaxCam — Painel (Fase 1: Fundação)

Frontend próprio do MaaxCam. **React 19 + Vite 6 + Tailwind CSS v4.**
Tema dark/azul (slate + blue), 100% nas classes especificadas. Esta é a Fase 1:
fundação visual + deploy. Autenticação (Supabase) entra na Fase 2.

> Esta versão **não tem nenhuma chave/API embutida** — diferente do Lovable. Seguro
> para ficar num repositório.

---

## 1. DNS (faça primeiro, leva alguns minutos pra propagar)

No painel de DNS do domínio `maaxcam.com.br`, crie um registro **A**:

```
painel   ->   137.184.100.204
```

(mesmo IP dos outros subdomínios). Confirme com: `dig +short painel.maaxcam.com.br`

---

## 2. Instalar o Node no servidor (uma vez só)

No Console da Digital Ocean:

```
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v
```

Espere ver algo como `v22.x` e `10.x`.

---

## 3. Clonar este repositório no servidor

O repo é **privado**, então use um token. Crie um GitHub Personal Access Token
(Settings → Developer settings → Tokens, escopo `repo`) e rode:

```
cd /opt
git clone https://SEU_TOKEN@github.com/SEU_USUARIO/maaxcam-painel.git painel
cd painel
```

(Resultado: o projeto fica em `/opt/painel`.)

---

## 4. Instalar dependências e gerar o build

```
cd /opt/painel
npm install
npm run build
```

Isso cria a pasta `/opt/painel/dist` (HTML/CSS/JS estáticos prontos).

---

## 5. Configurar o Nginx

O bloco já está pronto em `deploy/painel.maaxcam.com.br.conf`:

```
sudo cp /opt/painel/deploy/painel.maaxcam.com.br.conf /etc/nginx/sites-available/painel.maaxcam.com.br
sudo ln -s /etc/nginx/sites-available/painel.maaxcam.com.br /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Se `nginx -t` der OK, abra `http://painel.maaxcam.com.br` — já deve carregar o painel.

---

## 6. SSL (mesmo padrão dos outros domínios)

```
sudo certbot --nginx -d painel.maaxcam.com.br
```

Pronto: `https://painel.maaxcam.com.br` no ar com cadeado.

---

## Atualizações futuras

Quando houver uma nova versão no repo:

```
cd /opt/painel
git pull
npm install
npm run build
```

(O Nginx serve a pasta `dist`, então o `git pull` + `build` já publica.)

---

## Rodar localmente (opcional, na sua máquina)

```
npm install
npm run dev
```

Abre em `http://localhost:5173`.
