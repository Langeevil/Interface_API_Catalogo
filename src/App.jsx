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
      message = response.status === 401 ? "Usuario ou senha invalidos" : message;
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
    { id: "length", label: "Minimo de 6 caracteres", valid: password.length >= 6 },
    { id: "trim", label: "Sem espacos no inicio ou fim", valid: password.length > 0 && password === password.trim() }
  ];
  const passed = checks.filter((item) => item.valid).length;
  const percent = Math.round((passed / checks.length) * 100);

  return (
    <aside className="password-bubble" id="password-requirements" aria-live="polite">
      <span className="bubble-signal" aria-hidden="true" />
      <strong>Requisitos da senha</strong>
      <div className="strength-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <ul>
        {checks.map((item) => (
          <li className={item.valid ? "is-valid" : ""} key={item.id}>
            <span aria-hidden="true">{item.valid ? "OK" : "--"}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
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
    <div className="pager" aria-label="Paginacao">
      <button className="btn btn-outline-secondary" disabled={page <= 0} onClick={() => onChange(page - 1)} type="button">
        Anterior
      </button>
      <span>
        Pagina {page + 1} de {totalPages}
      </span>
      <button
        className="btn btn-outline-secondary"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        Proxima
      </button>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", senha: "" });
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
      setFeedback({ type: "error", message: "Usuario ou senha invalidos" });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: "info", message: "" });

    if (registerForm.senha.length < 6) {
      setFeedback({ type: "error", message: "A senha precisa ter no minimo 6 caracteres." });
      setSubmitting(false);
      return;
    }

    if (registerForm.senha !== registerForm.confirmarSenha) {
      setFeedback({ type: "error", message: "A confirmacao de senha nao confere." });
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
          <p className="eyebrow">Inventario Fatec</p>
          <h1 id="login-title">{isRegister ? "Criar conta" : "Acesso ao painel"}</h1>
          <p className="login-copy">
            {isRegister
              ? "Cadastre um usuario para acessar o painel de gerenciamento."
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

              <div className="password-field-row auth-password-row">
                <Field id="register-password" label="Senha">
                  <input
                    aria-describedby="password-requirements"
                    aria-invalid={registerForm.senha.length > 0 && registerForm.senha.length < 6}
                    autoComplete="new-password"
                    className="form-control"
                    id="register-password"
                    minLength="6"
                    onChange={(event) => setRegisterForm({ ...registerForm, senha: event.target.value })}
                    required
                    type="password"
                    value={registerForm.senha}
                  />
                </Field>
                <PasswordBubble password={registerForm.senha} />
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
                Ja possui conta?{" "}
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

        <aside className="login-aside" aria-label="Resumo da interface">
          <span className="aside-badge">SPA Fullstack</span>
          <h2>Controle rapido do inventario</h2>
          <p>Produtos em cards responsivos, filtros por categoria e cadastro integrado diretamente com a API.</p>
          <div className="aside-stats" aria-hidden="true">
            <span>Produtos</span>
            <span>Categorias</span>
            <span>Usuarios</span>
          </div>
        </aside>
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
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productForm, setProductForm] = useState(emptyProduct);

  const [categories, setCategories] = useState([]);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userForm, setUserForm] = useState(emptyUser);

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
    if (userForm.senha.length < 6) {
      notify("error", "A senha precisa ter no minimo 6 caracteres.");
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
      notify("success", "Usuario cadastrado.");
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
      notify("success", "Categoria excluida.");
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
          <p className="eyebrow">Inventario Fatec</p>
          <h1>Gerenciamento de inventario</h1>
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

      <nav className="tabs nav nav-pills" aria-label="Secoes da interface">
        {[
          ["products", "Produtos"],
          ["categories", "Categorias"],
          ["users", "Usuarios"]
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
              <h2 id="products-title">Produtos</h2>
              <p>{selectedCategory ? `Filtro ativo: ${selectedCategory.nome}` : "Cards responsivos com dados reais da API."}</p>
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
              <h3>{productForm.id ? "Editar produto" : "Novo produto"}</h3>
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
              <Field id="product-price" label="Preco">
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

            <div className="product-grid" aria-live="polite">
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
              <p>Gerencie as opcoes usadas no select de produtos.</p>
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
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.nome}</td>
                        <td>
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
              <h2 id="users-title">Usuarios</h2>
              <p>Crie usuarios com senha validada antes do envio.</p>
            </div>
          </div>

          <div className="content-grid users-grid">
            <form className="panel form-panel" onSubmit={submitUser}>
              <h3>Novo usuario</h3>
              <Field id="user-name" label="Nome">
                <input
                  className="form-control"
                  id="user-name"
                  onChange={(event) => setUserForm({ ...userForm, nome: event.target.value })}
                  required
                  value={userForm.nome}
                />
              </Field>
              <Field id="user-email" label="Email">
                <input
                  className="form-control"
                  id="user-email"
                  onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                  required
                  type="email"
                  value={userForm.email}
                />
              </Field>
              <div className="password-field-row">
                <Field id="user-password" label="Senha">
                  <input
                    aria-describedby="password-requirements"
                    aria-invalid={userForm.senha.length > 0 && userForm.senha.length < 6}
                    className="form-control"
                    id="user-password"
                    minLength="6"
                    onChange={(event) => setUserForm({ ...userForm, senha: event.target.value })}
                    required
                    type="password"
                    value={userForm.senha}
                  />
                </Field>
                <PasswordBubble password={userForm.senha} />
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
                Criar usuario
              </button>
            </form>

            <div className="panel table-panel">
              {users.length ? (
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Perfil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.nome}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className="role-pill">{user.role}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">Nenhum usuario encontrado.</div>
              )}
              <Pager page={userPage} totalPages={userTotalPages} onChange={loadUsers} />
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
