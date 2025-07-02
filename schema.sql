-- Book Table --
CREATE TABLE Book (
    ISBN VARCHAR(20) PRIMARY KEY,
    Pages INTEGER,
    Subject VARCHAR(100),
    CoverURL TEXT,
    Title TEXT,
    Author TEXT
);

-- User Table --
CREATE TABLE AppUser (
    ID SERIAL PRIMARY KEY
);

-- Skill Table --
CREATE TABLE Skill (
    SkillName VARCHAR(100) PRIMARY KEY
);

-- UserBook Table --
CREATE TABLE UserBook (
    UserID INTEGER REFERENCES AppUser(ID),
    ISBN VARCHAR(20) REFERENCES Book(ISBN),
    SkillName VARCHAR(100) REFERENCES Skill(SkillName),
    PagesRead INTEGER,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, ISBN)
);

-- UserSkill Table --
CREATE TABLE UserSkill (
    SkillName VARCHAR(100) REFERENCES Skill(SkillName),
    UserID INTEGER REFERENCES AppUser(ID),
    ExpGained INTEGER DEFAULT 0,
    ExpToNext INTEGER DEFAULT 0,
    SkillLevel INTEGER DEFAULT 1,
    PRIMARY KEY (SkillName, UserID)
);
