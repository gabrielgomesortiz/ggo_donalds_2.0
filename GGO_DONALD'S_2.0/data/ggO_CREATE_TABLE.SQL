CREATE TABLE Pessoa (
    id_pessoa SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(100) NOT NULL
);

CREATE TABLE Cargo (
    id_cargo SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL
);

CREATE TABLE Funcionario (
    id_funcionario SERIAL PRIMARY KEY,      
    id_pessoa INT NOT NULL UNIQUE,                 
    id_cargo INT NOT NULL,
    salario NUMERIC(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    CONSTRAINT fk_funcionario_pessoa FOREIGN KEY (id_pessoa)
        REFERENCES Pessoa (id_pessoa) ON DELETE CASCADE,
    CONSTRAINT fk_funcionario_cargo FOREIGN KEY (id_cargo)
        REFERENCES Cargo (id_cargo)
);

CREATE TABLE Categoria (
    id_categoria SERIAL PRIMARY KEY,
    nome_categoria VARCHAR(100) NOT NULL
);

CREATE TABLE Produto (
    id_produto SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    id_categoria INT NOT NULL,
    caminho_imagem VARCHAR(255),
    quantidade_estoque INT NOT NULL,
    data_fabricacao DATE NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria) REFERENCES Categoria (id_categoria)
);


CREATE TABLE Forma_Pagamento (
    id_forma_pagamento SERIAL PRIMARY KEY,
    nome_forma_pagamento VARCHAR(50) NOT NULL
);

CREATE TABLE Pagamento (
    id_pagamento SERIAL PRIMARY KEY,
    id_forma_pagamento INT NOT NULL,
    status_pagamento BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_pagamento_forma FOREIGN KEY (id_forma_pagamento) 
        REFERENCES Forma_Pagamento (id_forma_pagamento)
);

CREATE TABLE Pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_pessoa INT NOT NULL,
    id_pagamento INT NOT NULL,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_pessoa FOREIGN KEY (id_pessoa) 
        REFERENCES Pessoa (id_pessoa) ON DELETE CASCADE,
    CONSTRAINT fk_pedido_pagamento FOREIGN KEY (id_pagamento) 
        REFERENCES Pagamento (id_pagamento)
);
