# Ateliê Charmoso

Claro. Abaixo está o prompt corrigido integralmente, com o nome ATELIÊ DA JHE em todos os pontos.

PROMPT MESTRE — SISTEMA ATELIÊ DA JHE

Quero que você desenvolva um sistema web completo para o Ateliê da JHE, especializado em costura, crochê e artesanato.

O sistema deve ser realmente funcional e preparado para uso, e não apenas um protótipo visual.

A identidade visual deve seguir fielmente a imagem/logo de referência fornecida neste projeto.

REGRA PRINCIPAL

Antes de começar a implementar:

Analise todos os requisitos abaixo.

Identifique as entidades, relacionamentos e regras de negócio.

Defina a arquitetura do sistema.

Defina a estrutura do banco de dados.

Defina as permissões e regras de segurança.

Defina os fluxos do usuário.

Verifique possíveis conflitos ou informações faltantes.

Só então comece a implementação.

Não elimine funcionalidades porque parecem complexas.

Se uma decisão técnica precisar ser tomada, escolha a solução mais segura, escalável e simples de manter.

1. OBJETIVO DO SISTEMA

O sistema terá duas áreas:

ÁREA PÚBLICA

Será o site do Ateliê da JHE.

O cliente poderá:

acessar o site;

visualizar produtos;

visualizar fotos;

visualizar preços;

escolher cores;

escolher quantidade;

solicitar personalizações;

adicionar produtos ao carrinho;

finalizar um pedido;

informar seus dados;

enviar o pedido.

O cliente NÃO precisa criar conta.

Não solicitar cadastro de cliente com senha.

O processo deve ser semelhante ao funcionamento de um catálogo de pedidos.

2. ÁREA ADMINISTRATIVA

Somente a dona do Ateliê da JHE terá acesso.

Ela deverá fazer login com:

e-mail;

senha.

O painel terá:

Dashboard;

Pedidos;

Agenda;

Produtos;

Categorias;

Materiais;

Financeiro;

Relatórios;

Configurações;

Minha conta;

Sair.

3. LOGIN

Criar uma tela de login elegante e coerente com a identidade visual do Ateliê da JHE.

Campos:

E-mail;

Senha.

Recursos:

mostrar/ocultar senha;

entrar;

esqueci minha senha.

A área administrativa deve ser protegida no backend.

Não basta esconder as páginas no frontend.

4. ESQUECI MINHA SENHA

Implementar recuperação de senha REAL.

Fluxo:

Tela

Esqueci minha senha

Campo:

E-mail

Botão:

Enviar link de recuperação

O sistema deverá enviar um link seguro para o e-mail cadastrado.

O link deverá permitir criar uma nova senha.

Campos:

Nova senha;

Confirmar nova senha.

Validar:

token válido;

token não expirado;

senha válida;

confirmação igual.

Após concluir:

Senha alterada com sucesso.

Botão:

Voltar para o login.

Não criar apenas uma tela falsa de recuperação.

A funcionalidade precisa estar conectada ao sistema de autenticação.

5. IDENTIDADE VISUAL

Utilize a imagem/logo de referência enviada como base principal da identidade visual do Ateliê da JHE.

A identidade do sistema deve transmitir:

artesanato;

costura;

crochê;

delicadeza;

sofisticação;

organização;

profissionalismo.

Cores de referência:

creme/off-white;

azul petróleo;

azul profundo;

rosa suave;

verde sálvia.

Utilizar elementos visuais relacionados a:

crochê;

linhas;

tecidos;

flores;

costura;

artesanato.

A logo deve ser utilizada de maneira consistente.

Não transformar o sistema em um dashboard empresarial genérico.

A identidade deve aparecer tanto no site público quanto no painel administrativo.

A identificação da marca deve ser sempre:

ATELIÊ DA JHE

Costura • Crochê • Artesanato

Não utilizar "JHUE", "JHEU", "JHÊ" ou qualquer outra variação.

6. SITE PÚBLICO

Criar:

Página inicial

Com:

logo;

nome Ateliê da JHE;

apresentação;

produtos em destaque;

categorias;

botão para visualizar produtos;

informações sobre o Ateliê;

contato;

WhatsApp;

rodapé.

Todo conteúdo que puder mudar deve ser administrável pelo painel.

7. CATÁLOGO

Criar catálogo totalmente dinâmico.

Os produtos NÃO podem ficar hardcoded.

A dona deverá conseguir:

criar produto;

editar produto;

desativar produto;

reativar produto;

alterar preço;

alterar descrição;

trocar fotos;

criar categorias;

definir cores;

definir opções de personalização;

definir prazo de produção.

No catálogo mostrar:

foto;

nome;

descrição resumida;

preço;

categoria;

botão "Ver produto".

8. PRODUTOS

Cada produto deve possuir:

nome;

descrição;

categoria;

preço;

fotos;

foto principal;

cores disponíveis;

possibilidade de personalização;

prazo estimado;

ativo/inativo.

Exemplo:

Bolsa de Crochê

R$ 89,90

Cores:

Bege;

Branco;

Preto;

Rosa;

Azul;

Outra.

Personalização:

"Você gostaria de alterar alguma coisa?"

Campo de texto.

9. FOTOS

Permitir upload de múltiplas fotos.

A dona poderá:

adicionar;

remover;

substituir;

definir foto principal.

As imagens precisam ser armazenadas corretamente.

Não quero imagens dependentes de links externos que possam quebrar.

10. PRODUTOS INATIVOS

Quando um produto deixar de ser vendido:

não apagar definitivamente.

Marcar:

ativo = false

Produtos inativos:

não aparecem no catálogo público;

continuam aparecendo nos pedidos antigos.

11. HISTÓRICO DE PREÇOS

Um pedido deve preservar o preço que existia no momento da compra.

Exemplo:

Produto custava:

R$ 80.

Cliente fez pedido.

Depois o preço passou para:

R$ 100.

O pedido antigo deve continuar registrando:

R$ 80.

Nunca recalcular pedidos antigos usando o preço atual do produto.

12. PÁGINA DO PRODUTO

Ao clicar em um produto:

Mostrar:

fotos;

nome;

descrição;

preço;

prazo;

cores;

quantidade;

personalização.

Botão:

Adicionar ao carrinho.

13. CARRINHO

Mostrar:

produto;

foto;

quantidade;

cor;

personalização;

preço unitário;

subtotal;

total.

Permitir:

aumentar quantidade;

diminuir quantidade;

remover item;

continuar comprando;

finalizar pedido.

14. CHECKOUT

O cliente não precisa criar conta.

Solicitar:

Obrigatórios

nome completo;

telefone/WhatsApp;

endereço completo.

Também:

complemento;

bairro;

cidade;

CEP;

observações.

Forma de recebimento:

Retirada;

Entrega.

Se selecionar entrega:

endereço obrigatório.

15. CONFIRMAÇÃO DO PEDIDO

Antes de finalizar, mostrar resumo completo:

produtos;

quantidade;

cores;

personalizações;

valores;

total;

nome;

telefone;

endereço;

forma de recebimento.

Botão:

Confirmar pedido

Após confirmar:

Pedido recebido com sucesso.

Gerar número único.

Exemplo:

#1024

16. PEDIDOS

Todo pedido deverá possuir:

número;

cliente;

telefone;

endereço;

produtos;

quantidade;

cores;

personalização;

valor;

data do pedido;

data prevista;

data de entrega;

status;

origem;

observações.

17. ORIGEM DO PEDIDO

Existem duas origens:

SITE

Cliente fez pelo site.

MANUAL

Dona cadastrou manualmente.

Salvar essa informação.

Permitir filtrar por origem.

18. PEDIDO MANUAL

A dona poderá receber pedidos por:

WhatsApp;

Instagram;

telefone;

pessoalmente;

outros.

Criar botão:

Novo pedido

Ela deverá conseguir cadastrar:

cliente;

telefone;

endereço;

produto;

quantidade;

cor;

personalização;

valor;

data;

prazo;

observações.

19. STATUS

Utilizar:

Novo

Confirmado

Em produção

Pronto

Entregue

Cancelado

Toda alteração de status deve ser registrada com:

status;

data;

horário.

Criar histórico do pedido.

20. WHATSAPP

Na lista de pedidos, o telefone deve ser clicável.

Ao clicar:

Abrir WhatsApp

Usar o número corretamente com código do Brasil.

No celular:

abrir aplicativo WhatsApp quando disponível.

No computador:

abrir WhatsApp Web quando aplicável.

Não deixar o número apenas como texto.

21. AGENDA

Criar uma agenda integrada aos pedidos.

Mostrar:

hoje;

semana;

mês;

próximas entregas;

atrasados.

Visualizações:

diária;

semanal;

mensal.

Pedidos vindos do site e pedidos manuais devem aparecer juntos.

22. DATA E TEMPO DE PRODUÇÃO

Quando o pedido for criado:

guardar:

data_pedido

Quando for entregue:

guardar:

data_entrega

Calcular:

tempo_producao = data_entrega - data_pedido

Exemplo:

Pedido:

20/08/2026

Entrega:

23/08/2026

Tempo:

3 dias.

Não permitir que a dona precise calcular manualmente.

23. PRAZO ESTIMADO

Cada produto poderá possuir prazo.

Exemplo:

Bolsa:

5 dias.

Ao criar o pedido:

data_prevista = data_pedido + prazo

A dona poderá corrigir a data prevista manualmente.

24. ATRASADOS

Se:

data_atual > data_prevista

e:

status != entregue

mostrar:

ATRASADO

Destacar visualmente no:

Dashboard;

agenda;

lista de pedidos.

25. MATERIAIS

Criar módulo:

Materiais

Permitir cadastrar:

nome;

categoria;

unidade;

quantidade;

valor pago;

data;

fornecedor;

observação.

Exemplos:

linha;

lã;

barbante;

tecido;

botão;

zíper;

enchimento;

embalagem;

fita.

26. CUSTO DOS MATERIAIS

O sistema deve permitir registrar o custo utilizado em cada pedido.

Idealmente trabalhar com:

quantidade comprada;

valor total;

unidade;

custo unitário;

quantidade utilizada;

custo utilizado.

Exemplo:

1.000 metros de linha:

R$ 30.

Custo por metro:

R$ 0,03.

Uso:

200 metros.

Custo:

R$ 6.

Também permitir lançamento manual do custo quando a dona não quiser controlar consumo detalhado.

27. FINANCEIRO

Criar módulo financeiro.

Mostrar:

Faturamento

Soma dos pedidos.

Custos

Materiais.

Lucro bruto

faturamento - custos

Margem bruta

lucro bruto / faturamento × 100

Ticket médio

faturamento / quantidade de pedidos

Não chamar de lucro líquido enquanto outras despesas não forem controladas.

28. PAGAMENTO

Preparar estrutura para:

Pendente;

Parcial;

Pago;

Reembolsado.

Campos:

valor total;

valor pago;

valor restante.

Isso permitirá trabalhar com sinal/entrada futuramente.

29. DASHBOARD

Criar Dashboard profissional do Ateliê da JHE.

Filtro:

hoje;

semana;

mês;

mês anterior;

personalizado.

Cards:

Pedidos

Quantidade.

Concluídos

Quantidade.

Em produção

Quantidade.

Atrasados

Quantidade.

Faturamento

R$.

Gastos

R$.

Lucro bruto

R$.

Ticket médio

R$.

Tempo médio

Dias.

30. GRÁFICOS

Criar:

Pedidos por período

Barras.

Pedidos por status

Pizza/rosca.

Faturamento

Barras ou linha.

Custos

Barras ou linha.

Lucro

Barras ou linha.

Produtos mais vendidos

Ranking.

Categorias

Ranking.

Todos devem responder ao filtro de período.

31. RELATÓRIO MENSAL

Criar:

Relatórios → selecionar mês

Exemplo:

Agosto/2026.

Mostrar:

pedidos;

concluídos;

cancelados;

pendentes;

atrasados;

faturamento;

custos;

lucro;

margem;

ticket médio;

tempo médio;

produto mais vendido;

produto que mais faturou;

categoria mais vendida.

Quando existir mês anterior:

comparar.

32. PRODUTOS MAIS VENDIDOS

Mostrar:

Produto:

Quantidade vendida.

Exemplo:

Bolsa de Crochê — 18

Tapete — 12

Necessaire — 9

33. PRODUTOS QUE MAIS FATURAM

Separar:

Mais vendidos

de:

Maior faturamento

Porque não são necessariamente a mesma coisa.

34. CONFIGURAÇÕES

Permitir alterar:

nome do Ateliê;

logo;

descrição;

WhatsApp;

endereço;

horários;

redes sociais;

informações de entrega;

informações de retirada;

mensagem de confirmação.

O nome padrão do sistema deve ser:

Ateliê da JHE

35. BANCO DE DADOS

Criar estrutura relacional adequada.

No mínimo considerar entidades equivalentes a:

usuários administrativos;

perfil;

produtos;

imagens;

categorias;

cores;

clientes;

pedidos;

itens dos pedidos;

materiais;

utilização de materiais;

registros financeiros;

histórico de status;

configurações do Ateliê.

Definir corretamente:

primary keys;

foreign keys;

índices;

constraints;

timestamps;

relacionamentos.

Evitar duplicação desnecessária.

36. SEGURANÇA

A segurança deve existir no backend/banco.

Não confiar somente no frontend.

Clientes não podem:

acessar pedidos de outras pessoas;

acessar dashboard;

acessar financeiro;

acessar materiais;

acessar configurações;

acessar dados administrativos.

Somente a administradora autenticada poderá acessar o painel.

Se utilizar Supabase:

implementar RLS corretamente.

37. PRIVACIDADE

Dados como:

nome;

telefone;

endereço;

pedidos;

são privados.

Não deixar essas informações disponíveis publicamente.

38. RESPONSIVIDADE

O sistema deve funcionar em:

celular;

tablet;

notebook;

desktop.

O site público deve ser pensado principalmente para celular.

O painel administrativo também precisa funcionar no celular.

Não simplesmente reduzir o desktop.

Adaptar:

menus;

tabelas;

cards;

gráficos;

formulários;

checkout.

39. PERFORMANCE

O sistema deve estar preparado para:

centenas de produtos;

milhares de pedidos;

muitos clientes;

histórico financeiro.

Utilizar:

paginação;

consultas eficientes;

carregamento otimizado;

otimização de imagens.

Não carregar todo o banco desnecessariamente.

40. DADOS HISTÓRICOS

Nunca modificar pedidos antigos porque um produto foi alterado.

Preservar:

preço histórico;

quantidade;

nome do produto no momento do pedido;

custos;

datas;

status.

41. CANCELAMENTO

Ao cancelar:

pedir confirmação.

Permitir informar motivo.

Exemplos:

cliente desistiu;

falta de material;

prazo;

outro.

Pedidos cancelados não devem ser considerados pedidos concluídos.

Definir claramente como serão tratados nas métricas.

42. DUPLICAR PEDIDO

Criar:

Duplicar pedido

Copiar:

cliente;

produtos;

opções;

personalizações.

Gerar:

novo número;

nova data;

novo pedido.

Status inicial:

Novo

Não copiar o status antigo.

43. FILTROS

Pedidos:

período;

status;

origem;

cliente;

produto;

categoria.

Busca:

número;

nome;

telefone.

Ordenação:

mais recentes;

mais antigos;

entrega próxima;

maior valor;

menor valor;

atrasados primeiro.

44. EXPORTAÇÃO

Preparar arquitetura para exportar:

pedidos;

financeiro;

materiais;

relatórios.

Formatos:

CSV;

Excel;

PDF.

Se for viável implementar agora, implemente.

45. TRATAMENTO DE ERROS

Nenhum erro técnico deve aparecer para o cliente.

Não mostrar mensagens como:

TypeError...

Mostrar mensagens amigáveis.

Registrar erros tecnicamente para diagnóstico.

46. ATUALIZAÇÃO DINÂMICA

Quando a dona alterar:

produto;

preço;

foto;

categoria;

cor;

disponibilidade;

prazo;

o site público deve refletir a alteração.

Quando um cliente fizer um pedido:

ele deve aparecer no painel administrativo.

47. ARQUITETURA DE MANUTENÇÃO

Não criar dependência desnecessária do Claude ou da ferramenta de desenvolvimento.

A dona precisa conseguir administrar o sistema sem alterar código.

Ela deve conseguir:

criar produto;

alterar preço;

trocar foto;

alterar descrição;

adicionar cor;

desativar produto;

cadastrar material;

cadastrar pedido;

alterar status.

48. TESTES OBRIGATÓRIOS

Antes de declarar o projeto concluído, execute testes reais.

TESTE DO CLIENTE

abrir site;

abrir produto;

selecionar cor;

selecionar quantidade;

adicionar personalização;

adicionar ao carrinho;

finalizar;

informar nome;

informar telefone;

informar endereço;

confirmar;

gerar pedido.

TESTE ADMINISTRATIVO

login;

logout;

esqueci senha;

recuperação;

alterar senha;

criar produto;

editar;

desativar;

criar categoria;

pedido manual;

alterar status;

registrar entrega;

calcular tempo;

cadastrar material;

registrar custo;

calcular lucro;

abrir WhatsApp;

agenda;

dashboard;

relatório.

49. TESTE FINANCEIRO

Criar pedido:

Venda:

R$ 150.

Custo:

R$ 50.

Esperado:

Lucro bruto:

R$ 100.

Margem:

66,67%.

Validar matematicamente.

50. TESTE DE PRAZO

Pedido:

20/08/2026.

Entrega:

23/08/2026.

Esperado:

3 dias.

Criar três pedidos:

3 dias; 4 dias; 2 dias.

Média esperada:

3 dias.

Confirmar no Dashboard.

51. TESTE DE PREÇO

Criar produto:

R$ 80.

Criar pedido.

Alterar produto:

R$ 100.

O pedido antigo deve continuar:

R$ 80.

52. TESTE DE SEGURANÇA

Sem login:

tentar acessar:

/dashboard

/pedidos

/financeiro

/materiais

Resultado:

acesso bloqueado.

Também testar acesso direto à API/banco quando aplicável.

53. TESTE MOBILE

Testar todas as telas principais em celular.

Verificar:

menu;

botões;

tabelas;

gráficos;

imagens;

checkout;

login;

recuperação;

Dashboard.

Não aceitar:

conteúdo cortado;

elementos sobrepostos;

botões inacessíveis;

rolagem horizontal desnecessária;

campos quebrados.

54. TESTE COM BANCO VAZIO

Testar:

nenhum pedido;

nenhum produto;

nenhum material;

nenhum relatório.

O sistema não pode quebrar.

Mostrar estados vazios amigáveis.

55. TESTE DE DADOS

Verificar:

criação;

leitura;

atualização;

desativação;

relacionamentos;

histórico;

integridade.

56. AUDITORIA FINAL

Antes de dizer "concluído", faça uma auditoria completa.

Verifique:

FRONTEND

Todas as telas.

BACKEND

Todas as funções.

BANCO

Relacionamentos e integridade.

SEGURANÇA

Autenticação e autorização.

FINANCEIRO

Todos os cálculos.

PEDIDOS

Fluxo completo.

AGENDA

Datas e atrasos.

MOBILE

Responsividade.

WHATSAPP

Link funcionando.

RECUPERAÇÃO

"Esqueci minha senha" funcionando de verdade.

57. REGRA FINAL — NÃO ENTREGAR INCOMPLETO

Não diga que o sistema está pronto apenas porque a interface foi construída.

O sistema só poderá ser considerado concluído quando:

o cliente conseguir pedir sem cadastro;

o pedido chegar ao painel;

pedido manual funcionar;

agenda funcionar;

produtos forem administráveis;

materiais funcionarem;

custos funcionarem;

faturamento funcionar;

lucro funcionar;

tempo de produção funcionar;

relatórios funcionarem;

gráficos funcionarem;

WhatsApp funcionar;

login funcionar;

recuperação de senha funcionar;

segurança estiver implementada;

banco estiver correto;

versão mobile funcionar.

Se encontrar algum erro durante os testes:

CORRIJA O ERRO E TESTE NOVAMENTE.

Não apenas informe que encontrou.

58. FORMA DE TRABALHO

Quero que você trabalhe em etapas:

ETAPA 1

Análise e arquitetura.

ETAPA 2

Banco de dados e autenticação.

ETAPA 3

Área pública.

ETAPA 4

Catálogo e produtos.

ETAPA 5

Carrinho e checkout.

ETAPA 6

Pedidos e agenda.

ETAPA 7

Materiais e custos.

ETAPA 8

Financeiro.

ETAPA 9

Dashboard e relatórios.

ETAPA 10

Segurança.

ETAPA 11

Responsividade.

ETAPA 12

Testes completos.

ETAPA 13

Correção dos problemas encontrados.

ETAPA 14

Auditoria final.

Não pule diretamente para a etapa final sem validar as anteriores.

59. PRIMEIRA RESPOSTA

Antes de escrever código, apresente:

arquitetura proposta;

stack tecnológica;

estrutura do banco;

principais telas;

fluxos;

regras de segurança;

plano de implementação;

possíveis riscos técnicos.

Depois disso, comece a implementação.

Não remova requisitos deste documento sem me informar.

OBJETIVO FINAL

Quero um sistema profissional para o ATELIÊ DA JHE, que funcione simultaneamente como:

CATÁLOGO + LOJA DE PEDIDOS + AGENDA + CONTROLE DE PRODUÇÃO + CONTROLE DE MATERIAIS + FINANCEIRO + DASHBOARD + RELATÓRIO.

A dona deve conseguir administrar o negócio pelo sistema sem depender de programação para fazer alterações rotineiras.

O cliente deve conseguir fazer um pedido de forma rápida, simples e sem criar conta.

A interface precisa ser bonita, mas a prioridade é:

FUNCIONALIDADE + SEGURANÇA + ORGANIZAÇÃO + CONFIABILIDADE DOS DADOS + FACILIDADE DE USO.

Comece primeiro pela análise da arquitetura e do banco de dados. Não comece criando apenas telas.

Nome oficial do projeto em todo o sistema: ATELIÊ DA JHE.

60. CONTA INICIAL — ADMINISTRADORA PRINCIPAL

O sistema deverá possuir uma primeira conta administrativa responsável pelo Ateliê da JHE.

Essa conta deverá ser criada durante a configuração inicial do sistema.

Credenciais iniciais

E-mail administrativo inicial:
joicegoncalvesvh@gmail.com

Senha inicial temporária:
dindinha123

Essas credenciais devem ser utilizadas SOMENTE para a criação inicial da conta administrativa.

A conta deverá possuir nível de acesso:

Administrador Principal / Dona do Ateliê

---

61. TROCA OBRIGATÓRIA DA SENHA NO PRIMEIRO ACESSO

A senha fornecida acima é uma senha temporária.

No primeiro login bem-sucedido, o sistema deverá identificar que essa é a primeira entrada da conta.

Antes de permitir acesso ao Dashboard ou qualquer outra área administrativa, deverá obrigatoriamente apresentar:

"Por segurança, você precisa criar uma nova senha antes de continuar."

Solicitar:

- Senha atual;
- Nova senha;
- Confirmar nova senha.

A nova senha deverá atender aos requisitos mínimos de segurança definidos pelo sistema.

Após a alteração:

- marcar a conta como "first_login_completed = true";
- invalidar a senha temporária;
- permitir acesso normal ao painel;
- não exigir novamente a troca de senha.

---

62. SEGURANÇA DA CREDENCIAL INICIAL

IMPORTANTE:

Não armazenar a senha em texto puro no banco de dados.

Não colocar a senha em:

- código JavaScript;
- frontend;
- arquivos públicos;
- variáveis expostas ao cliente;
- logs;
- mensagens de erro;
- respostas da API.

A senha deverá ser tratada pelo sistema de autenticação de forma segura.

Se a aplicação utilizar Supabase Auth, Firebase Auth, Clerk ou outro serviço de autenticação, utilizar o mecanismo oficial de autenticação e armazenamento seguro de credenciais.

A conta inicial deverá ser criada com privilégio administrativo no backend.

---

63. PROTEÇÃO CONTRA ACESSO INDEVIDO

O e-mail da administradora não deve, por si só, conceder acesso administrativo.

O sistema deverá verificar a autenticação e a função/permissão do usuário no backend.

A conta inicial deverá possuir:

"role = admin"

ou estrutura equivalente.

Somente usuários autorizados poderão acessar:

- Dashboard;
- Pedidos;
- Agenda;
- Produtos administrativos;
- Materiais;
- Financeiro;
- Relatórios;
- Configurações.

---

64. RECUPERAÇÃO DE SENHA

A conta inicial também deverá utilizar o fluxo normal de:

Esqueci minha senha

Caso a administradora esqueça a nova senha criada após o primeiro acesso, poderá solicitar recuperação através do e-mail cadastrado.

O fluxo de recuperação deverá funcionar independentemente da senha temporária inicial.

---

65. NÃO CRIAR UMA SEGUNDA CONTA ADMINISTRATIVA AUTOMATICAMENTE

Na instalação inicial, criar somente a conta administrativa inicial especificada neste requisito.

Não criar usuários administrativos fictícios.

Não utilizar:

- admin@example.com;
- teste@test.com;
- administrador@teste.com;
- senhas genéricas.

Se forem necessários dados de teste durante o desenvolvimento, mantê-los separados dos dados reais e removê-los antes da entrega.

---

66. VALIDAÇÃO DA CONTA INICIAL

Durante os testes finais, confirmar:

1. A conta inicial consegue fazer login.
2. O sistema identifica que é o primeiro acesso.
3. O sistema bloqueia o acesso ao painel até a troca da senha.
4. A nova senha pode ser criada.
5. A senha temporária deixa de funcionar.
6. A nova senha permite login normalmente.
7. O botão "Esqueci minha senha" funciona.
8. A conta possui permissões de Administrador Principal.
9. Usuários não autenticados não conseguem acessar o painel.
10. Usuários sem permissão administrativa não conseguem acessar dados administrativos.

Não considerar a implementação concluída se a conta inicial não funcionar corretamente.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://jhes-artisan-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0939a13b-251b-4e31-90eb-151c61875e8a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
