# 🚀 Guia de Deploy - Organiza.AI + Stripe

## ✅ **Status: Código Pronto para Deploy**

Todo o código foi commitado e enviado para o repositório. Agora você precisa:
1. Adicionar variáveis de ambiente na Vercel
2. Fazer deploy
3. Configurar webhook de produção no Stripe

---

## 📋 **Passo 1: Adicionar Env Vars na Vercel**

### **Acessar Dashboard da Vercel**
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **organiza-ai** (ou kesh)
3. Vá em **Settings** → **Environment Variables**

### **Adicionar as 3 Variáveis do Stripe**

#### **1. STRIPE_SECRET_KEY**
- **Nome:** `STRIPE_SECRET_KEY`
- **Valor:** `sk_live_...` (Pegar no painel do Stripe)
- **Ambientes:** Production, Preview, Development (marcar todos)
- Clique **Add**

#### **2. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
- **Nome:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Valor:** `pk_live_51QUcmcFz7A1qFfrQX7RiHOAwzmuW54JhcPr08NZdCMh9MsMGw0MKiXA9MU1KAM9oVlGhBszyoFVoskmY2xg45ZZ6006DkizKpL`
- **Ambientes:** Production, Preview, Development (marcar todos)
- **⚠️ AVISO ESPERADO:** O Vercel mostrará um alerta dizendo que esta chave pode expor informações sensíveis. **Isto é SEGURO e esperado.** Esta é a chave publicável (`pk_live_...`) do Stripe, que é projetada para ser exposta publicamente no browser. Clique **"Continue"** ou **"Confirm"** para adicionar.
- Clique **Add**

#### **3. STRIPE_WEBHOOK_SECRET**
- **Nome:** `STRIPE_WEBHOOK_SECRET`
- **Valor:** `whsec_PLACEHOLDER_WILL_BE_SET_AFTER_WEBHOOK_CONFIGURATION`
- **Ambientes:** Production, Preview, Development (marcar todos)
- Clique **Add**

**⚠️ IMPORTANTE:** O `STRIPE_WEBHOOK_SECRET` será atualizado depois que você configurar o webhook (Passo 3).

---

## 🚢 **Passo 2: Deploy na Vercel**

### **Opção A: Deploy Automático (Recomendado)**
O Vercel já detectou o push no GitHub e deve estar fazendo deploy automaticamente. Verifique:
1. Acesse: https://vercel.com/dashboard
2. Veja se há um deployment em progresso
3. Aguarde finalizar (geralmente 2-3 minutos)

### **Opção B: Deploy Manual**
Se o deploy automático não iniciou:
1. Vá em **Deployments**
2. Clique **Deploy** ou **Redeploy**
3. Aguarde a conclusão

### **Verificar Deploy**
Após o deploy finalizar:
- Anote a URL de produção: `https://organiza-ai.vercel.app` (ou similar)
- Você precisará dessa URL para o próximo passo

---

## 🔗 **Passo 3: Configurar Webhook de Produção no Stripe**

### **Criar Endpoint de Webhook**
1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique **+ Add endpoint**

### **Configurar Endpoint**
- **Endpoint URL:** `https://organiza-ai.vercel.app/api/webhooks/stripe`
  - ⚠️ Substitua `organiza-ai.vercel.app` pela sua URL real da Vercel
- **Description:** `Organiza.AI Production Webhook`
- **Version:** Latest API version (padrão)

### **Selecionar Eventos**
Marque APENAS estes 5 eventos:
- ✅ `checkout.session.completed`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

Clique **Add endpoint**

### **Copiar Signing Secret**
1. Após criar o webhook, clique nele
2. Na seção **Signing secret**, clique **Reveal**
3. Copie o valor (começa com `whsec_`)

### **Atualizar Env Var na Vercel**
1. Volte para o Dashboard da Vercel
2. Vá em **Settings** → **Environment Variables**
3. Encontre `STRIPE_WEBHOOK_SECRET`
4. Clique nos **3 pontinhos** → **Edit**
5. Cole o novo valor (`whsec_...`)
6. Clique **Save**

### **Redeploy para Aplicar o Webhook Secret**
1. Vá em **Deployments**
2. Clique nos **3 pontinhos** do último deployment
3. Clique **Redeploy**
4. Aguarde finalizar

---

## ✅ **Passo 4: Rodar Migrations no Supabase**

**⚠️ CRÍTICO:** As migrations DEVEM ser rodadas antes de usar o sistema em produção.

### **Via Supabase Dashboard (Recomendado)**
1. Acesse: https://supabase.com/dashboard/project/yhlegmuvemhhbkcdabma/sql/new
2. Copie o conteúdo de `supabase/migrations/20260322000000_stripe_subscriptions.sql`
3. Cole no editor SQL
4. Clique **Run**
5. Repita para `supabase/migrations/20260322000001_seed_prices.sql`

### **Via Supabase CLI**
```bash
supabase db push
```

---

## 🧪 **Passo 5: Testar End-to-End em Produção**

### **1. Teste de Criação de Conta**
- Acesse `https://organiza-ai.vercel.app/signup`
- Crie uma conta nova
- Complete o onboarding até o Step 4 (Plano)

### **2. Teste de Checkout do Stripe**
- Clique **Assinar** em qualquer plano
- Use o cartão de teste: `4242 4242 4242 4242`
- Data: qualquer futura (ex: 12/26)
- CVC: qualquer (ex: 123)
- CEP: qualquer (ex: 12345-678)
- Complete o checkout

### **3. Verificar Webhook**
1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique no webhook criado
3. Vá em **Events**
4. Deve aparecer `checkout.session.completed` com status **Succeeded**

### **4. Verificar Banco de Dados**
1. Acesse: https://supabase.com/dashboard/project/yhlegmuvemhhbkcdabma/editor
2. Tabela `subscriptions` → deve ter 1 registro com `status = 'active'`
3. Tabela `stripe_webhook_events` → deve ter eventos processados

### **5. Verificar Dashboard**
- Acesse `https://organiza-ai.vercel.app/dashboard`
- Todos os 6 indicadores devem estar visíveis (não bloqueados)
- Se estiver no plano free, apenas 2 indicadores ficam visíveis

### **6. Testar Gerenciamento de Assinatura**
- Acesse `https://organiza-ai.vercel.app/configuracoes/assinatura`
- Clique **Gerenciar Assinatura**
- Deve abrir o Stripe Customer Portal
- Teste cancelar/reativar assinatura

---

## 🔐 **Modo Test vs Live**

### **Atualmente você está em:**
- ✅ **Live Mode** (chaves `sk_live_...` e `pk_live_...`)
- Isso significa que pagamentos REAIS serão processados

### **Para usar Test Mode:**
1. No Stripe Dashboard, alterne para **Test Mode** (switch no canto superior direito)
2. Copie as chaves de teste: `sk_test_...` e `pk_test_...`
3. Atualize as env vars na Vercel com as chaves de teste
4. Configure um webhook separado para test mode
5. Redeploy

**Recomendação:** Mantenha Live Mode apenas se quiser aceitar pagamentos reais imediatamente. Caso contrário, use Test Mode primeiro.

---

## 📊 **Monitoramento**

### **Verificar Logs de Webhook**
- Stripe Dashboard → Webhooks → Seu endpoint → Events
- Vercel Dashboard → Deployments → [último deploy] → Logs

### **Verificar Erros**
- Supabase Dashboard → Logs
- Vercel Dashboard → Functions → /api/webhooks/stripe

### **Métricas Importantes**
- Taxa de sucesso de webhooks (deve ser >99%)
- Tempo de processamento (<500ms)
- Erros de idempotência (deve ser 0)

---

## 🎯 **Próximos Passos (Opcional)**

### **1. Configurar Billing Alerts no Stripe**
- Stripe Dashboard → Settings → Billing → Set up billing alerts
- Defina alertas para volumes inesperados

### **2. Customizar Emails do Stripe**
- Stripe Dashboard → Settings → Emails
- Adicione logo e cores da marca

### **3. Configurar Domínio Customizado**
- Vercel Dashboard → Settings → Domains
- Adicione seu domínio (ex: `app.organiza.ai`)

### **4. Adicionar Analytics**
- Instale PostHog, Mixpanel ou Google Analytics
- Tracked events: conversão de checkout, cancelamentos, etc.

---

## 🚨 **Troubleshooting**

### **Webhook retorna 500**
- Verifique logs da Vercel
- Certifique-se que migrations foram rodadas
- Verifique se `STRIPE_WEBHOOK_SECRET` está correto

### **Checkout não redireciona**
- Verifique console do browser para erros
- Certifique-se que `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está definida
- Verifique logs da API `/api/stripe/create-checkout`

### **Assinatura não aparece no banco**
- Verifique se webhook foi recebido no Stripe Dashboard
- Verifique logs da function `/api/webhooks/stripe`
- Verifique se evento `checkout.session.completed` foi processado

### **Quota não funciona**
- Verifique se migrations foram rodadas
- Verifique se as colunas de quota existem em `user_profiles`
- Teste criar transação manual (deve incrementar `transactions_count`)

---

## ✅ **Checklist Final de Deploy**

- [ ] ✅ Código commitado e enviado para o GitHub
- [ ] ⏳ Env vars adicionadas na Vercel (3 variáveis)
- [ ] ⏳ Deploy realizado e URL de produção anotada
- [ ] ⏳ Webhook criado no Stripe Dashboard
- [ ] ⏳ `STRIPE_WEBHOOK_SECRET` atualizado na Vercel
- [ ] ⏳ Redeploy realizado após atualizar webhook secret
- [ ] ⏳ Migrations rodadas no Supabase
- [ ] ⏳ Teste end-to-end realizado (signup → checkout → dashboard)
- [ ] ⏳ Verificação de webhook bem-sucedida
- [ ] ⏳ Verificação de dados no Supabase

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs da Vercel e Supabase
2. Consulte a documentação do Stripe: https://docs.stripe.com
3. Verifique os arquivos de documentação:
   - `STRIPE_IMPLEMENTATION_SUMMARY.md` (visão geral técnica)
   - `IMPLEMENTACAO_COMPLETA.md` (guia completo em português)

---

**Data:** 22 de Março de 2026
**Status:** ✅ Código Pronto | ⏳ Aguardando Deploy
**Última Atualização:** Commit `b870c85` (Stripe integration complete)
