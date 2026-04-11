# scanixbody

Aja como um Product Manager sênior, Arquiteto de Software, Engenheiro de Software full stack, especialista em segurança, modelagem de banco de dados, APIs escaláveis, UX/UI responsiva e front-end moderno.

Sua missão é criar o sistema completo chamado SCANIX BODY, usando como referência obrigatória o HTML base/protótipo já existente. O novo sistema deve preservar 100% dos módulos, regras, cálculos, automações, fluxos, dados, design, cores, ícones, estrutura visual e intenção funcional do protótipo original, evoluindo-o para uma aplicação real, escalável, segura e pronta para virar app no futuro.

OBJETIVO DO PROJETO
Criar uma aplicação web responsiva, mobile-first e desktop-ready, com arquitetura limpa, escalável e segura, já preparada para servir de base para um aplicativo mobile que reutilizará os mesmos dados, regras e APIs. O sistema deve rodar com:
- Front-end moderno
- Back-end/API
- Supabase como banco/autenticação/storage
- GitHub para versionamento
- Render para deploy
- Claude Code como motor de geração e evolução do código

DIRETRIZES GERAIS
1. Preserve integralmente a lógica do protótipo anexo.
2. Não simplifique módulos existentes.
3. Não descaracterize visualmente o sistema.
4. Mantenha a identidade visual dark/athletic/tech do Scanix Body.
5. Estruture o projeto de forma profissional para crescimento.
6. Todo código deve ser limpo, modular, tipado quando aplicável, reutilizável e preparado para manutenção.
7. Separar claramente:
   - camada de apresentação
   - componentes reutilizáveis
   - domínio/regra de negócio
   - serviços
   - integrações externas
   - autenticação/autorização
   - acesso a dados
   - observabilidade/logs/erros
8. Criar arquitetura pronta para API e futura app mobile.
9. Toda regra de negócio deve ficar fora da camada visual.
10. Toda comunicação com banco deve ser feita por camada de serviço/repositório.
11. Aplicar princípios de Clean Code, SOLID, DRY, KISS onde fizer sentido.
12. Preparar o sistema para internacionalização futura, mas manter pt-BR como padrão inicial.
13. Criar estrutura que suporte webhooks, jobs assíncronos e integrações futuras.
14. Criar documentação mínima do projeto e README profissional.

STACK DESEJADA
Escolha uma stack moderna e coerente, preferencialmente:
- Front-end: Next.js ou React com TypeScript
- UI: componentes reutilizáveis + design tokens + Tailwind ou CSS modular bem estruturado
- Estado: estratégia simples e escalável
- Validação: schema validation
- Back-end: rotas server/API handlers ou arquitetura full stack moderna
- Banco: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage para arquivos
- Deploy: Render
- Versionamento: GitHub

Se optar por uma stack diferente, explique no README por que ela é superior para este caso.

REFERÊNCIA OBRIGATÓRIA DO PROTÓTIPO
Considere como obrigatórios os seguintes módulos já existentes no protótipo:
1. Treinos
   - cadastro de dias de treino
   - grupos musculares
   - cadastro de exercícios
   - séries
   - reps alvo
   - carga
   - descanso
   - exclusão
   - importação de treino por arquivo
   - cardio vinculado ao contexto do treino

2. Registrar treino
   - seleção do dia de treino
   - seleção de data
   - início de sessão
   - preenchimento de séries executadas
   - peso e repetições por série
   - salvar sessão
   - identificar PR quando superar melhor carga anterior

3. Progresso
   - estatísticas gerais
   - sessões registradas
   - total de séries
   - volume total
   - exercícios cadastrados
   - evolução por exercício
   - gráfico de melhor carga por data

4. Histórico
   - lista de treinos registrados
   - detalhamento por sessão
   - possibilidade de exclusão

5. Dieta
   - modo manual
   - modo análise por IA
   - modo importação por arquivo
   - cadastro de refeições
   - horário
   - alimentos
   - cálculo de macros
   - calorias
   - proteína
   - carboidrato
   - gordura
   - resumo nutricional
   - pontos positivos
   - pontos de melhoria

6. Corpo e objetivo
   - dados pessoais
   - peso
   - altura
   - idade
   - sexo
   - composição corporal
   - percentual de gordura
   - massa de gordura
   - massa muscular esquelética
   - massa magra
   - água corporal
   - proteína
   - minerais
   - IMC
   - TMB
   - gordura visceral
   - relação cintura-quadril
   - grau de obesidade
   - score InBody
   - peso ideal
   - massa magra segmentar
   - gordura segmentar
   - meta principal
   - nível de atividade
   - período
   - água por dia
   - sono
   - qualidade do sono
   - observações
   - painel corporal com indicadores calculados
   - TDEE estimado
   - leitura do estado corporal

7. Bioimpedância
   - upload de PDF
   - extração estruturada de dados via IA
   - preenchimento automático dos campos do corpo
   - revisão antes de salvar

8. Medicamentos
   - cadastro manual
   - importação por arquivo
   - categorias: hormônio, peptídeo, suplemento, medicamento, sarm, outro
   - dose
   - frequência
   - via
   - início
   - observações
   - aviso importante no contexto do módulo

9. Exames
   - importação de laudo por arquivo
   - colar texto
   - extração de marcadores laboratoriais
   - valor
   - unidade
   - referência
   - status: normal, alto, baixo, crítico
   - persistência dos exames
   - exclusão

10. Análise IA
   - checklist de completude
   - cruzamento entre treino, dieta, corpo, cardio, medicamentos e exames
   - geração de score por eixo
   - score treino
   - score dieta
   - score sono
   - score hidratação
   - score cardio
   - score geral
   - recomendações
   - ajustes sugeridos de macros, calorias e água
   - relatório visual consolidado
   - pronto para impressão/exportação

11. Cardio
   - informar se pratica ou não
   - tipo
   - intensidade
   - duração
   - frequência
   - momento
   - objetivo
   - exibição em banner/resumo

REQUISITO NOVO OBRIGATÓRIO: GESTÃO DE USUÁRIOS E ACESSOS
Adicionar ao sistema um módulo administrativo profissional que não existe no protótipo original, contendo:
1. autenticação com usuário e senha
2. login por credenciais cadastradas no sistema
3. senha inicial padrão gerada/controlada pelo sistema
4. troca obrigatória de senha no primeiro acesso para qualquer tipo de usuário
5. recuperação de senha
6. sessão segura
7. logout
8. bloqueio após tentativas inválidas, se fizer sentido
9. trilha de auditoria básica de acesso

Criar perfis e papéis:
- super_admin
- admin
- coach
- operador
- usuario_final

Definir claramente:
- quem acessa tudo
- quem administra usuários
- quem edita dados mestres
- quem visualiza somente seus próprios dados
- quem pode importar laudos/arquivos
- quem pode gerar análise IA
- quem pode excluir dados
- quem pode consultar dashboards administrativos

Criar CRUD completo de:
- usuários
- perfis/papéis
- permissões
- status de usuário
- reset de senha administrativo
- vínculo do usuário com seu próprio perfil esportivo/biológico

REGRAS DE SEGURANÇA E PRIVACIDADE
1. Aplicar Row Level Security no banco.
2. Garantir isolamento dos dados por usuário.
3. Perfis administrativos devem ter privilégios explícitos, nunca implícitos.
4. Dados sensíveis de saúde devem ser protegidos.
5. Nunca confiar apenas em validação do front-end.
6. Validar payloads no servidor.
7. Criar logs de auditoria para ações críticas.
8. Sanitizar uploads e entradas.
9. Preparar limites de tamanho e tipo de arquivos.
10. Adotar boas práticas de secrets management.
11. Não expor chaves sensíveis no cliente.
12. Preparar estrutura para LGPD desde o início.

ARQUITETURA FUNCIONAL
Estruture o projeto em grandes áreas:
- Autenticação e autorização
- Cadastro e administração
- Núcleo ScanixBody do usuário
- Importações e extrações por IA
- Análise consolidada por IA
- Relatórios e histórico
- Configurações
- Observabilidade e auditoria do sistema

ARQUITETURA TÉCNICA
Criar uma estrutura de pastas profissional.
Exemplo esperado:
- app / src
- components
- modules
- services
- repositories
- lib
- hooks
- types
- validators
- styles
- api
- auth
- admin
- uploads
- analytics
- tests

ENTIDADES DE DOMÍNIO QUE DEVEM EXISTIR
No mínimo, considerar:
- user
- profile
- role
- permission
- user_profile_assignment
- athlete_profile
- workout_day
- workout_exercise
- workout_session
- workout_session_exercise
- workout_session_set
- cardio_plan_or_cardio_profile
- meal
- meal_item_text
- diet_analysis
- body_assessment
- body_segment
- bioimpedance_import
- medication_entry
- medication_import
- exam_report
- exam_marker
- ai_analysis_report
- file_asset
- audit_log
- password_reset_or_first_access_control

IMPORTAÇÕES E IA
O sistema deve já nascer com uma camada de integração preparada para IA, mas desacoplada.
Criar serviços desacoplados para:
- importar treino de PDF/DOCX/TXT
- importar dieta
- importar medicamentos
- importar exames
- importar bioimpedância
- gerar análise consolidada

Cada serviço deve:
- aceitar arquivo ou texto
- normalizar entrada
- extrair estrutura padronizada
- validar JSON retornado
- tratar erro
- salvar origem e resultado
- permitir revisão manual antes da confirmação final, quando aplicável

CÁLCULOS E REGRAS DE NEGÓCIO
Implemente e mantenha as regras do protótipo:
- IMC
- classificação de IMC
- TMB estimada por sexo quando não preenchida
- TDEE conforme nível de atividade
- percentual de gordura derivado quando possível
- cálculo de volume total de treino
- melhor carga por exercício
- detecção de PR
- estimativa de macros por refeição
- consolidação diária de macros
- leitura de exames com status
- consolidação de checklist para análise IA

A camada de regra deve ser separada da UI.

UX/UI E DESIGN
Preservar fielmente a identidade visual do protótipo:
- tema dark
- base preta/esverdeada
- acento verde principal
- tipografia com estilo atlético/tech
- uso de badges, cards, blocos escuros, contraste alto
- linguagem visual masculina/fitness/high-performance
- manter a essência dos ícones já usados no protótipo
- manter aparência de dashboard operacional e pessoal

Criar design tokens para:
- cores
- bordas
- tipografia
- espaçamento
- componentes
- estados
- feedback visual

RESPONSIVIDADE
O sistema precisa ser excelente em:
- mobile
- tablet
- desktop

Como ele vai virar app depois, a experiência mobile deve nascer bem resolvida:
- navegação clara
- componentes tocáveis
- formulários amigáveis
- tabelas adaptadas
- cards responsivos
- fluxo de upload amigável
- boa performance em telas menores

MÓDULOS ADICIONAIS QUE UM SISTEMA REAL DEVE TER
Além do protótipo, adicionar na criação:
1. Dashboard inicial por perfil
2. Página de login
3. Primeiro acesso / troca de senha
4. Meu perfil
5. Administração de usuários
6. Administração de perfis e permissões
7. Central de arquivos/importações
8. Histórico de análises IA
9. Configurações do sistema
10. Logs/auditoria para admin
11. Tratamento de erros e estados vazios
12. Páginas de fallback e empty states
13. Política básica de retenção de dados e exclusão lógica, quando fizer sentido

PRONTA PARA VIRAR APP
Toda modelagem e APIs devem ser construídas para futuro consumo por:
- app mobile
- webhook
- integrações externas
- automações futuras

Portanto:
- criar endpoints consistentes
- usar contratos claros
- evitar acoplamento com o front
- separar domínio e interface
- prever versionamento de API
- preparar upload de arquivo e retorno estruturado
- prever notificações futuras

ENTREGAS ESPERADAS
Quero que você gere:
1. a estrutura completa do projeto
2. o código-base do sistema
3. os módulos principais implementados
4. a camada de autenticação/autorização
5. o CRUD administrativo de usuários e perfis
6. os schemas e tipos
7. os serviços de integração com Supabase
8. a camada de importação/IA desacoplada
9. as páginas/telas principais
10. componentes reutilizáveis
11. README completo com:
   - stack
   - arquitetura
   - como rodar local
   - como configurar Supabase
   - como publicar no Render
   - como usar GitHub
12. arquivo .env.example
13. seeds iniciais
14. instruções de deploy
15. instruções para evolução futura para mobile

CRITÉRIOS DE QUALIDADE
- código organizado
- sem gambiarra
- sem lógica crítica escondida na view
- nomes consistentes
- boa legibilidade
- separação de responsabilidades
- segurança adequada
- dados sensíveis protegidos
- pronto para escala moderada
- pronto para manutenção profissional

IMPORTANTE
Antes de gerar código:
1. leia o protótipo como contrato funcional
2. mapeie módulos, entidades, fluxos e regras
3. proponha a arquitetura final
4. só então gere o projeto

Quero a resposta organizada em:
1. visão de produto
2. arquitetura proposta
3. estrutura de pastas
4. modelagem funcional
5. plano de implementação por fases
6. geração do código inicial do projeto
