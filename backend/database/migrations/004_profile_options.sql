ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS study_family varchar(120);

INSERT INTO skills (name, category) VALUES
    ('Smart', 'Competency'),
    ('Fast learner', 'Competency'),
    ('Teamwork', 'Competency'),
    ('Communication', 'Competency'),
    ('Problem solving', 'Competency'),
    ('Adaptability', 'Competency'),
    ('Creativity', 'Competency'),
    ('Organisation', 'Competency'),
    ('Time management', 'Competency'),
    ('Critical thinking', 'Competency'),
    ('Initiative', 'Competency'),
    ('Responsibility', 'Competency'),
    ('Attention to detail', 'Competency'),
    ('Leadership', 'Competency'),
    ('Empathy', 'Competency'),
    ('Customer service', 'Competency'),
    ('Conflict resolution', 'Competency'),
    ('Autonomy', 'Competency'),
    ('Resilience', 'Competency'),
    ('Digital literacy', 'Competency')
ON CONFLICT (name) DO NOTHING;

INSERT INTO qualifications (code, name) VALUES
    ('GM', 'Grau Mig'),
    ('GS', 'Grau Superior'),
    ('BAT', 'Batxillerat')
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (name) VALUES
    ('Administració i gestió'),
    ('Agrària'),
    ('Arts gràfiques'),
    ('Comerç i màrqueting'),
    ('Edificació i obra civil'),
    ('Electricitat i electrònica'),
    ('Energia i aigua'),
    ('Fabricació mecànica'),
    ('Fusta, moble i suro'),
    ('Hoteleria i turisme'),
    ('Imatge i so'),
    ('Imatge personal i perruqueria'),
    ('Indústries alimentàries'),
    ('Informàtica i comunicacions'),
    ('Instal·lació i manteniment'),
    ('Química'),
    ('Sanitat'),
    ('Serveis socioculturals i a la comunitat'),
    ('Tèxtil, confecció i pell'),
    ('Transport i manteniment de vehicles'),
    ('Activitats físiques i esportives'),
    ('Seguretat i medi ambient')
ON CONFLICT (name) DO NOTHING;

INSERT INTO languages (code, name) VALUES ('ca', 'Català'), ('es', 'Castellà'), ('en', 'English'), ('fr', 'Français'), ('de', 'Deutsch') ON CONFLICT (code) DO NOTHING;
