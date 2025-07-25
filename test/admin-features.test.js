const request = require("supertest");
const express = require("express");
const userRoutes = require("../src/routes/userRoutes");
const userService = require("../src/services/userService");
const chai = require("chai");
const expect = chai.expect;
global.should = chai.should();

const app = express();
app.use(express.json());
app.use("/", userRoutes);

describe("Funcionalidades de Administrador", () => {
  let adminToken;
  let userToken;
  beforeEach(async () => {
    userService._reset && userService._reset();
    // Login como admin
    const resAdmin = await request(app)
      .post("/login")
      .send({ username: "admin@email.com", password: "Admin123456!" });
    adminToken = resAdmin.body.token;
    // Login como usuário comum
    const resUser = await request(app)
      .post("/login")
      .send({ username: "user@email.com", password: "User12345678!" });
    userToken = resUser.body.token;
  });

  it("Admin altera senha de outro usuário com sucesso", async () => {
    await request(app)
      .post('/register')
      .send({ username: 'admin-teste1@email.com', password: 'SenhaForte123!' });
    const resposta = await request(app)
      .patch('/admin/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'admin-teste1@email.com', password: 'NovaSenhaAdm123!' });
    resposta.status.should.equal(200);
    resposta.body.message.should.equal('Usuário atualizado com sucesso.');
  });

  it("Admin altera nome de outro usuário com sucesso", async () => {
    await request(app)
      .post('/register')
      .send({ username: 'admin-teste2@email.com', password: 'SenhaForte123!' });
    const resposta = await request(app)
      .patch('/admin/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'admin-teste2@email.com', newUsername: 'novo.admin-teste2@email.com' });
    resposta.status.should.equal(200);
    resposta.body.message.should.equal('Usuário atualizado com sucesso.');
    await request(app)
      .patch('/admin/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'novo.admin-teste2@email.com', newUsername: 'admin-teste2@email.com' });
  });

  it('Usuário comum não pode alterar outro usuário (token válido)', async () => {
    await request(app)
      .post('/register')
      .send({ username: 'admin-teste3@email.com', password: 'SenhaForte123!' });
    const respostaUser = await request(app)
      .post('/login')
      .send({ username: 'admin-teste3@email.com', password: 'SenhaForte123!' });
    const userToken = respostaUser.body.token;
    const resposta = await request(app)
      .patch('/admin/user')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'admin@email.com', password: 'Admin123456!' });
    resposta.status.should.equal(403);
    resposta.body.message.should.match(/Apenas administradores/);
  });

  it("Usuário comum não pode alterar outro usuário (token válido)", async () => {
    // Gera token válido do usuário comum imediatamente antes do teste
    const resUser = await request(app)
      .post("/login")
      .send({ username: "user@email.com", password: "User12345678!" });
    const userToken = resUser.body.token;
    const res = await request(app)
      .patch("/admin/user")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ username: "admin@email.com" });
    res.status.should.equal(403);
    res.body.message.should.match(/Apenas administradores/);
  });

  it("Usuário comum não pode alterar outro usuário (token inválido)", async () => {
    const res = await request(app)
      .patch("/admin/user")
      .set("Authorization", "Bearer tokeninvalido")
      .send({ username: "user@email.com", newUsername: "admin@email.com" });
    res.status.should.equal(403);
    res.body.message.should.equal("Token inválido.");
  });

  it("Usuário comum não pode alterar outro usuário (sem token)", async () => {
    const res = await request(app)
      .patch("/admin/user")
      .send({ username: "admin@email.com", newPassword: "Admin123456!" });
    res.status.should.equal(401);
    res.body.message.should.equal("Token não fornecido.");
  });

  it("Admin deleta usuário com sucesso", async () => {
    const res = await request(app)
      .delete("/admin/user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "user@email.com" });
    res.status.should.equal(200);
    res.body.message.should.equal("Usuário deletado com sucesso.");
  });

  it("Usuário comum não pode deletar usuário (token válido)", async () => {
    const resUser = await request(app)
      .post("/login")
      .send({ username: "user@email.com", password: "User12345678!" });
    userToken = resUser.body.token;

    const res = await request(app)
      .delete("/admin/user")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ username: "admin@email.com" });
    res.status.should.equal(403);
    res.body.message.should.match(/Apenas administradores/);
  });

  it("Usuário comum não pode deletar usuário (token inválido)", async () => {
    const resUser = await request(app)
      .post("/login")
      .send({ username: "user@email.com", password: "User12345678!" });
    userToken = resUser.body.token;

    const res = await request(app)
      .delete("/admin/user")
      .set("Authorization", "Bearer tokeninvalido")
      .send({ username: "admin@email.com" });
    res.status.should.equal(403);
    res.body.message.should.equal("Token inválido.");
  });

  it("Usuário comum não pode deletar usuário (sem token)", async () => {
    // Garante que o usuário existe
    await request(app)
      .post('/register')
      .send({ username: 'admin-teste4@email.com', password: 'SenhaForte123!' });
    const resposta = await request(app)
      .delete('/admin/user')
      .send({ username: 'admin-teste4@email.com' });
    resposta.status.should.equal(401);
    resposta.body.message.should.equal('Token não fornecido.');
  });

  it('Usuário comum não pode deletar usuário (token válido)', async () => {
    await request(app)
      .post('/register')
      .send({ username: 'admin-teste5@email.com', password: 'SenhaForte123!' });
    const respostaUser = await request(app)
      .post('/login')
      .send({ username: 'admin-teste5@email.com', password: 'SenhaForte123!' });
    const userToken = respostaUser.body.token;
    const resposta = await request(app)
      .delete('/admin/user')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'admin@email.com' });
    resposta.status.should.equal(403);
    resposta.body.message.should.match(/Apenas administradores/);
  });

  it("Admin tenta deletar usuário inexistente", async () => {
    const res = await request(app)
      .delete("/admin/user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "naoexiste@email.com" });
    res.status.should.equal(404);
    res.body.message.should.equal("Usuário não encontrado.");
  });
});

describe("GET /admin/users", () => {
  let adminToken;
  let userToken;
  beforeEach(async () => {
    userService._reset && userService._reset();
    // Login como admin
    const resAdmin = await request(app)
      .post("/login")
      .send({ username: "admin@email.com", password: "Admin123456!" });
    adminToken = resAdmin.body.token;
    // Login como usuário comum
    const resUser = await request(app)
      .post("/login")
      .send({ username: "user@email.com", password: "User12345678!" });
    userToken = resUser.body.token;
  });

  it("deve retornar a lista de usuários para admin autenticado", async () => {
    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    res.status.should.equal(200);
    res.body.should.be.an("array");
    res.body.some((u) => u.username === "admin@email.com").should.be.true;
    res.body.some((u) => u.username === "user@email.com").should.be.true;
  });
  
  it("deve retornar 403 para usuário comum", async () => {
    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    res.status.should.equal(403);
    res.body.message.should.match(/Apenas administradores/);
  });

  it("deve retornar 403 para token inválido", async () => {
    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", "Bearer tokeninvalido");
    res.status.should.equal(403);
    res.body.message.should.match(/Token inválido./);
  });

  it("deve retornar 401 para requisição sem token", async () => {
    const res = await request(app).get("/admin/users");
    res.status.should.equal(401);
    res.body.message.should.match(/Token não fornecido/);
  });

  it("Não permite GET em /admin/user", async () => {
    const res = await request(app)
      .get("/admin/user")
      .set("Authorization", `Bearer ${adminToken}`);
    expect([404, 405]).to.include(res.status);
  });

  it("Não permite POST em /admin/user", async () => {
    const res = await request(app)
      .post("/admin/user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "alguem@email.com" });
    expect([404, 405]).to.include(res.status);
  });

  it("Não permite PUT em /admin/user", async () => {
    const res = await request(app)
      .put("/admin/user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "alguem@email.com" });
    expect([404, 405]).to.include(res.status);
  });

  it("Não permite DELETE em /admin/users", async () => {
    const res = await request(app)
      .delete("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect([404, 405]).to.include(res.status);
  });

  it("Não permite POST em /admin/users", async () => {
    const res = await request(app)
      .post("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect([404, 405]).to.include(res.status);
  });

  it("Não permite PUT em /admin/users", async () => {
    const res = await request(app)
      .put("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect([404, 405]).to.include(res.status);
  });
});

describe("Permissão de Usuário Comum em Endpoints de Admin", () => {
  beforeEach(async () => {
    userService._reset && userService._reset();
  });

  it("Usuário comum não pode acessar endpoint de admin", async () => {
    const resUser = await request(app)
      .post("/login")
      .send({ username: "user@email.com", password: "User12345678!" });
    userToken = resUser.body.token;
    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    res.status.should.equal(403);
    res.body.message.should.match(/Apenas administradores/);
  });
});
