import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const PAGE_SIZE = 8;
const SESSION_KEY = "api-interface-session";

const emptyProduct = { id: null, nome: "", preco: "", categoriaId: "" };
const emptyCategory = { id: null, nome: "" };
const emptyUser = { nome: "", email: "", senha: "", role: "USER" };

function apiUrl(path, params = {}) {
  const base = API_BASE || window.location.origin;
  const url = new URL(path, base);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return API_BASE ? url.toString() : `${url.pathname}${url.search}`;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      message = response.status === 401 ? "Usuário ou senha inválidos" : message;
    }
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

function pageItems(page) {
  return Array.isArray(page?.content) ? page.content : [];
}

function currency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function PasswordBubble({ password }) {
  const checks = [
    { id: "length", label: "Mínimo de 8 caracteres", valid: password.length >= 8 },
    { id: "upper", label: "Uma letra maiúscula", valid: /[A-Z]/.test(password) },
    { id: "lower", label: "Uma letra minúscula", valid: /[a-z]/.test(password) },
    { id: "number", label: "Um número", valid: /\d/.test(password) },
    { id: "symbol", label: "Um caractere especial", valid: /[^A-Za-z0-9]/.test(password) },
    { id: "trim", label: "Sem espaços no início ou fim", valid: password.length > 0 && password === password.trim() }
  ];
  const passed = checks.filter((item) => item.valid).length;
  const percent = Math.round((passed / checks.length) * 100);
  const strengthLabel = percent >= 84 ? "Forte" : percent >= 50 ? "Média" : "Fraca";
  const allValid = passed === checks.length;

  return (
    <aside className="password-bubble" id="password-requirements" aria-live="polite">
      <div className="bubble-header">
        <span className={`lock-icon ${allValid ? "locked" : "unlocked"}`} aria-hidden="true">
          {allValid ? <LockIcon /> : <UnlockIcon />}
        </span>
        <div>
          <strong>Segurança da senha</strong>
          <small>{strengthLabel}</small>
        </div>
      </div>
      <div className="strength-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <ul>
        {checks.map((item) => (
          <li className={item.valid ? "is-valid" : ""} key={item.id}>
            <span aria-hidden="true">{item.valid ? "✓" : ""}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function IconBase({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function LockIcon() {
  return (
    <IconBase>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </IconBase>
  );
}

function UnlockIcon() {
  return (
    <IconBase>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </IconBase>
  );
}

function Alert({ feedback }) {
  if (!feedback.message) {
    return null;
  }

  const tone = feedback.type === "error" ? "danger" : feedback.type === "success" ? "success" : "info";
  return (
    <div className={`alert alert-${tone} app-alert`} role="status" aria-live="polite">
      {feedback.message}
    </div>
  );
}

function Field({ id, label, children, hint }) {
  return (
    <div className="field">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? <div className="form-text">{hint}</div> : null}
    </div>
  );
}

function Pager({ page, totalPages, onChange }) {
  return (
    <div className="pager" aria-label="Paginação">
      <button className="btn btn-outline-secondary" disabled={page <= 0} onClick={() => onChange(page - 1)} type="button">
        Anterior
      </button>
      <span>
        Página {page + 1} de {totalPages}
      </span>
      <button
        className="btn btn-outline-secondary"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        Próxima
      </button>
    </div>
  );
}

function StatCard({ label, value, detail, tone, icon }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span className="stat-icon" aria-hidden="true">
        {icon === "box" ? <BoxIcon /> : null}
        {icon === "tag" ? <TagIcon /> : null}
        {icon === "user" ? <UserIcon /> : null}
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
      <path d="M4 7.5V16l8 5 8-5V7.5" />
      <path d="M12 12v9" />
      <path d="m8 5.25 8 4.5" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M20.5 13.5 13.5 20.5a2 2 0 0 1-2.8 0L3 12.8V3h9.8l7.7 7.7a2 2 0 0 1 0 2.8Z" />
      <path d="M7.5 7.5h.01" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
    </svg>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", senha: "" });
  const [registerPasswordFocused, setRegisterPasswordFocused] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: ""
  });
  const [feedback, setFeedback] = useState({ type: "info", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: "info", message: "" });

    try {
      const user = await request(apiUrl("/api/auth/login"), {
        method: "POST",
        body: JSON.stringify({ email: form.email.trim(), senha: form.senha })
      });
      onLogin(user);
    } catch (error) {
      setFeedback({ type: "error", message: "Usuário ou senha inválidos" });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: "info", message: "" });

    if (registerForm.senha.length < 8) {
      setFeedback({ type: "error", message: "A senha precisa ter no mínimo 8 caracteres." });
      setSubmitting(false);
      return;
    }

    if (registerForm.senha !== registerForm.confirmarSenha) {
      setFeedback({ type: "error", message: "A confirmação de senha não confere." });
      setSubmitting(false);
      return;
    }

    try {
      await request(apiUrl("/api/usuarios"), {
        method: "POST",
        body: JSON.stringify({
          nome: registerForm.nome.trim(),
          email: registerForm.email.trim(),
          senha: registerForm.senha,
          role: "USER"
        })
      });

      setRegisterForm({ nome: "", email: "", senha: "", confirmarSenha: "" });
      setForm({ email: registerForm.email.trim(), senha: "" });
      setMode("login");
      setFeedback({ type: "success", message: "Conta criada. Entre com sua senha para acessar." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setFeedback({ type: "info", message: "" });
  }

  const isRegister = mode === "register";

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-main">
        <p className="eyebrow">Inventário Fatec</p>
          <h1 id="login-title">{isRegister ? "Criar conta" : "Acesso ao painel"}</h1>
          <p className="login-copy">
            {isRegister
              ? "Cadastre um usuário para acessar o painel de gerenciamento."
              : "Entre com seu e-mail e senha para gerenciar produtos e categorias."}
          </p>

          <Alert feedback={feedback} />

          {isRegister ? (
            <form className="login-form register-form" onSubmit={submitRegister}>
              <Field id="register-name" label="Nome">
                <input
                  autoComplete="name"
                  className="form-control"
                  id="register-name"
                  onChange={(event) => setRegisterForm({ ...registerForm, nome: event.target.value })}
                  required
                  value={registerForm.nome}
                />
              </Field>

              <Field id="register-email" label="E-mail">
                <input
                  aria-invalid={registerForm.email.length > 0 && !registerForm.email.includes("@")}
                  autoComplete="email"
                  className="form-control"
                  id="register-email"
                  onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                  required
                  type="email"
                  value={registerForm.email}
                />
              </Field>

              <div className="auth-password-row">
                <Field id="register-password" label="Senha">
                  <input
                    aria-describedby="password-requirements"
                    aria-invalid={registerForm.senha.length > 0 && registerForm.senha.length < 8}
                    autoComplete="new-password"
                    className="form-control"
                    id="register-password"
                    minLength="8"
                    onBlur={() => setRegisterPasswordFocused(false)}
                    onChange={(event) => setRegisterForm({ ...registerForm, senha: event.target.value })}
                    onFocus={() => setRegisterPasswordFocused(true)}
                    required
                    type="password"
                    value={registerForm.senha}
                  />
                </Field>
                {registerPasswordFocused ? <PasswordBubble password={registerForm.senha} /> : null}
              </div>

              <Field id="register-confirm-password" label="Confirmar senha">
                <input
                  aria-invalid={
                    registerForm.confirmarSenha.length > 0 && registerForm.confirmarSenha !== registerForm.senha
                  }
                  autoComplete="new-password"
                  className="form-control"
                  id="register-confirm-password"
                  minLength="6"
                  onChange={(event) => setRegisterForm({ ...registerForm, confirmarSenha: event.target.value })}
                  required
                  type="password"
                  value={registerForm.confirmarSenha}
                />
              </Field>

              <button className="btn btn-primary w-100" disabled={submitting} type="submit">
                {submitting ? "Cadastrando..." : "Cadastrar"}
              </button>

              <p className="auth-switch">
                Já possui conta?{" "}
                <button className="link-button" onClick={() => switchMode("login")} type="button">
                  Entrar aqui
                </button>
              </p>
            </form>
          ) : (
            <form className="login-form" onSubmit={submit}>
              <Field id="login-email" label="E-mail">
                <input
                  aria-invalid={form.email.length > 0 && !form.email.includes("@")}
                  autoComplete="email"
                  className="form-control"
                  id="login-email"
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                  type="email"
                  value={form.email}
                />
              </Field>

              <Field id="login-password" label="Senha">
                <input
                  autoComplete="current-password"
                  className="form-control"
                  id="login-password"
                  minLength="6"
                  onChange={(event) => setForm({ ...form, senha: event.target.value })}
                  required
                  type="password"
                  value={form.senha}
                />
              </Field>

              <button className="btn btn-primary w-100" disabled={submitting} type="submit">
                {submitting ? "Validando..." : "Entrar"}
              </button>

              <p className="auth-switch">
                Não possui conta?{" "}
                <button className="link-button" onClick={() => switchMode("register")} type="button">
                  Cadastre-se aqui
                </button>
              </p>
            </form>
          )}
        </div>

      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [activeTab, setActiveTab] = useState("products");
  const [feedback, setFeedback] = useState({ type: "info", message: "" });
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotalItems, setProductTotalItems] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productForm, setProductForm] = useState(emptyProduct);

  const [categories, setCategories] = useState([]);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const [categoryTotalItems, setCategoryTotalItems] = useState(0);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalItems, setUserTotalItems] = useState(0);
  const [userForm, setUserForm] = useState(emptyUser);
  const [userPasswordFocused, setUserPasswordFocused] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(categoryFilter)),
    [categories, categoryFilter]
  );

  function notify(type, message) {
    setFeedback({ type, message });
  }

  function handleLogin(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setSession(user);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  async function loadProducts(page = productPage) {
    setLoading(true);
    try {
      const path = categoryFilter
        ? apiUrl(`/api/produtos/categoria/${categoryFilter}`, { page, size: PAGE_SIZE, sort: "nome,asc" })
        : apiUrl("/api/produtos", { nome: productSearch, page, size: PAGE_SIZE, sort: "nome,asc" });
      const data = await request(path);
      setProducts(pageItems(data));
      setProductPage(data.number ?? page);
      setProductTotalPages(Math.max(data.totalPages ?? 1, 1));
      setProductTotalItems(data.totalElements ?? pageItems(data).length);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories(page = categoryPage) {
    setLoading(true);
    try {
      const data = await request(apiUrl("/api/categorias", { nome: categorySearch, page, size: PAGE_SIZE }));
      setCategories(pageItems(data));
      setCategoryPage(data.number ?? page);
      setCategoryTotalPages(Math.max(data.totalPages ?? 1, 1));
      setCategoryTotalItems(data.totalElements ?? pageItems(data).length);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers(page = userPage) {
    setLoading(true);
    try {
      const data = await request(apiUrl("/api/usuarios", { page, size: PAGE_SIZE }));
      setUsers(pageItems(data));
      setUserPage(data.number ?? page);
      setUserTotalPages(Math.max(data.totalPages ?? 1, 1));
      setUserTotalItems(data.totalElements ?? pageItems(data).length);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) {
      return;
    }
    loadCategories(0);
    loadProducts(0);
    loadUsers(0);
  }, [session]);

  useEffect(() => {
    if (session) {
      loadProducts(0);
    }
  }, [categoryFilter]);

  async function submitProduct(event) {
    event.preventDefault();
    const payload = {
      nome: productForm.nome.trim(),
      preco: Number(productForm.preco),
      categoriaId: Number(productForm.categoriaId)
    };
    const editing = Boolean(productForm.id);

    try {
      await request(apiUrl(editing ? `/api/produtos/${productForm.id}` : "/api/produtos"), {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      setProductForm(emptyProduct);
      notify("success", editing ? "Produto atualizado." : "Produto cadastrado.");
      await loadProducts(editing ? productPage : 0);
    } catch (error) {
      notify("error", error.message);
    }
  }

  async function submitCategory(event) {
    event.preventDefault();
    const editing = Boolean(categoryForm.id);

    try {
      await request(apiUrl(editing ? `/api/categorias/${categoryForm.id}` : "/api/categorias"), {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ nome: categoryForm.nome.trim() })
      });
      setCategoryForm(emptyCategory);
      notify("success", editing ? "Categoria atualizada." : "Categoria cadastrada.");
      await loadCategories(editing ? categoryPage : 0);
      await loadProducts(productPage);
    } catch (error) {
      notify("error", error.message);
    }
  }

  async function submitUser(event) {
    event.preventDefault();
    if (userForm.senha.length < 8) {
      notify("error", "A senha precisa ter no mínimo 8 caracteres.");
      return;
    }

    try {
      await request(apiUrl("/api/usuarios"), {
        method: "POST",
        body: JSON.stringify({
          nome: userForm.nome.trim(),
          email: userForm.email.trim(),
          senha: userForm.senha,
          role: userForm.role
        })
      });
      setUserForm(emptyUser);
      notify("success", "Usuário cadastrado.");
      await loadUsers(0);
    } catch (error) {
      notify("error", error.message);
    }
  }

  async function removeProduct(id) {
    try {
      await request(apiUrl(`/api/produtos/${id}`), { method: "DELETE" });
      notify("success", "Produto excluido.");
      await loadProducts(productPage);
    } catch (error) {
      notify("error", error.message);
    }
  }

  async function removeCategory(id) {
    try {
      await request(apiUrl(`/api/categorias/${id}`), { method: "DELETE" });
      notify("success", "Categoria excluída.");
      await loadCategories(categoryPage);
      await loadProducts(productPage);
    } catch (error) {
      notify("error", error.message);
    }
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Inventário Fatec</p>
          <h1>Gerenciamento de inventário</h1>
        </div>
        <div className="header-actions">
          <span className={loading ? "sync-dot active" : "sync-dot"} aria-hidden="true" />
          <span>{session.nome || session.email}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout} type="button">
            Sair
          </button>
        </div>
      </header>

      <Alert feedback={feedback} />

      <section className="dashboard-overview" aria-labelledby="overview-title">
        <div className="overview-panel">
          <span className="overview-kicker">Dashboard</span>
          <h2 id="overview-title">Visão geral do inventário</h2>
          <p>
            {selectedCategory
              ? `Produtos filtrados por ${selectedCategory.nome}.`
              : "Acompanhe os cadastros principais e acesse rapidamente as áreas da API."}
          </p>
        </div>

        <div className="stats-grid">
          <StatCard
            detail="Cadastrados no inventário"
            icon="box"
            label="Produtos"
            tone="products"
            value={productTotalItems}
          />
          <StatCard
            detail="Opções de classificação"
            icon="tag"
            label="Categorias"
            tone="categories"
            value={categoryTotalItems}
          />
          <StatCard
            detail="Acessos cadastrados"
            icon="user"
            label="Usuários"
            tone="users"
            value={userTotalItems}
          />
        </div>
      </section>

      <nav className="tabs nav nav-pills" aria-label="Secoes da interface">
        {[
          ["products", "Produtos"],
          ["categories", "Categorias"],
          ["users", "Usuários"]
        ].map(([id, label]) => (
          <button
            className={`nav-link ${activeTab === id ? "active" : ""}`}
            key={id}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "products" ? (
        <section className="workspace" aria-labelledby="products-title">
          <div className="section-heading">
            <div>
              <h2 id="products-title">Painel de produtos</h2>
              <p>{selectedCategory ? `Filtro ativo: ${selectedCategory.nome}` : `${productTotalItems} produtos cadastrados.`}</p>
            </div>
            <form className="filter-row" onSubmit={(event) => {
              event.preventDefault();
              loadProducts(0);
            }}>
              <input
                aria-label="Buscar produto por nome"
                className="form-control"
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Buscar por nome"
                value={productSearch}
              />
              <select
                aria-label="Filtrar por categoria"
                className="form-select"
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nome}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" type="submit">
                Buscar
              </button>
            </form>
          </div>

          <div className="content-grid">
            <form className="panel form-panel" onSubmit={submitProduct}>
              <div className="panel-title-row">
                <div>
                  <span className="panel-kicker">Cadastro</span>
                  <h3>{productForm.id ? "Editar produto" : "Novo produto"}</h3>
                </div>
              </div>
              <Field id="product-name" label="Nome">
                <input
                  className="form-control"
                  id="product-name"
                  minLength="3"
                  onChange={(event) => setProductForm({ ...productForm, nome: event.target.value })}
                  required
                  value={productForm.nome}
                />
              </Field>
              <Field id="product-price" label="Preço">
                <input
                  className="form-control"
                  id="product-price"
                  min="0.01"
                  onChange={(event) => setProductForm({ ...productForm, preco: event.target.value })}
                  required
                  step="0.01"
                  type="number"
                  value={productForm.preco}
                />
              </Field>
              <Field id="product-category" label="Categoria">
                <select
                  className="form-select"
                  id="product-category"
                  onChange={(event) => setProductForm({ ...productForm, categoriaId: event.target.value })}
                  required
                  value={productForm.categoriaId}
                >
                  <option value="">Selecione</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="button-row">
                <button className="btn btn-primary" type="submit">
                  {productForm.id ? "Salvar" : "Cadastrar"}
                </button>
                {productForm.id ? (
                  <button className="btn btn-outline-secondary" onClick={() => setProductForm(emptyProduct)} type="button">
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>

            <div className="panel product-list-panel" aria-live="polite">
              <div className="product-grid">
                {products.length ? (
                  products.map((product) => (
                    <article className="product-card" key={product.id}>
                      <div>
                        <span className="category-chip">{product.categoria?.nome || "Sem categoria"}</span>
                        <h3>{product.nome}</h3>
                      </div>
                      <p className="price">{currency(product.preco)}</p>
                      <div className="button-row">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            setProductForm({
                              id: product.id,
                              nome: product.nome,
                              preco: product.preco,
                              categoriaId: product.categoria?.id || ""
                            })
                          }
                          type="button"
                        >
                          Editar
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => removeProduct(product.id)} type="button">
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">Nenhum produto encontrado.</div>
                )}
              </div>
              <Pager page={productPage} totalPages={productTotalPages} onChange={loadProducts} />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "categories" ? (
        <section className="workspace" aria-labelledby="categories-title">
          <div className="section-heading">
            <div>
              <h2 id="categories-title">Categorias</h2>
              <p>Gerencie as opções usadas no select de produtos.</p>
            </div>
            <form className="filter-row" onSubmit={(event) => {
              event.preventDefault();
              loadCategories(0);
            }}>
              <input
                aria-label="Buscar categoria por nome"
                className="form-control"
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Buscar categoria"
                value={categorySearch}
              />
              <button className="btn btn-primary" type="submit">
                Buscar
              </button>
            </form>
          </div>

          <div className="content-grid">
            <form className="panel form-panel" onSubmit={submitCategory}>
              <h3>{categoryForm.id ? "Editar categoria" : "Nova categoria"}</h3>
              <Field id="category-name" label="Nome">
                <input
                  className="form-control"
                  id="category-name"
                  minLength="3"
                  onChange={(event) => setCategoryForm({ ...categoryForm, nome: event.target.value })}
                  required
                  value={categoryForm.nome}
                />
              </Field>
              <div className="button-row">
                <button className="btn btn-primary" type="submit">
                  {categoryForm.id ? "Salvar" : "Cadastrar"}
                </button>
                {categoryForm.id ? (
                  <button className="btn btn-outline-secondary" onClick={() => setCategoryForm(emptyCategory)} type="button">
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>

            <div className="panel table-panel">
              {categories.length ? (
                <table className="table align-middle data-table categories-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td data-label="Categoria">{category.nome}</td>
                        <td data-label="Ações">
                          <div className="button-row">
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setCategoryForm(category)} type="button">
                              Editar
                            </button>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => removeCategory(category.id)} type="button">
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">Nenhuma categoria encontrada.</div>
              )}
              <Pager page={categoryPage} totalPages={categoryTotalPages} onChange={loadCategories} />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "users" ? (
        <section className="workspace" aria-labelledby="users-title">
          <div className="section-heading">
            <div>
              <h2 id="users-title">Usuários</h2>
              <p>Crie usuários com senha validada antes do envio.</p>
            </div>
          </div>

          <div className="content-grid users-grid">
            <form className="panel form-panel" onSubmit={submitUser}>
              <h3>Novo usuário</h3>
              <Field id="user-name" label="Nome">
                <input
                  className="form-control"
                  id="user-name"
                  onChange={(event) => setUserForm({ ...userForm, nome: event.target.value })}
                  required
                  value={userForm.nome}
                />
              </Field>
              <Field id="user-email" label="E-mail">
                <input
                  className="form-control"
                  id="user-email"
                  onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                  required
                  type="email"
                  value={userForm.email}
                />
              </Field>
              <div className="auth-password-row">
                <Field id="user-password" label="Senha">
                  <input
                    aria-describedby="password-requirements"
                    aria-invalid={userForm.senha.length > 0 && userForm.senha.length < 8}
                    className="form-control"
                    id="user-password"
                    minLength="8"
                    onBlur={() => setUserPasswordFocused(false)}
                    onChange={(event) => setUserForm({ ...userForm, senha: event.target.value })}
                    onFocus={() => setUserPasswordFocused(true)}
                    required
                    type="password"
                    value={userForm.senha}
                  />
                </Field>
                {userPasswordFocused ? <PasswordBubble password={userForm.senha} /> : null}
              </div>
              <Field id="user-role" label="Perfil">
                <select
                  className="form-select"
                  id="user-role"
                  onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
                  value={userForm.role}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </Field>
              <button className="btn btn-primary" type="submit">
                Criar usuário
              </button>
            </form>

            <div className="panel table-panel">
              {users.length ? (
                <table className="table align-middle data-table users-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Perfil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td data-label="Nome">{user.nome}</td>
                        <td data-label="E-mail">{user.email}</td>
                        <td data-label="Perfil">
                          <span className="role-pill">{user.role}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">Nenhum usuário encontrado.</div>
              )}
              <Pager page={userPage} totalPages={userTotalPages} onChange={loadUsers} />
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
