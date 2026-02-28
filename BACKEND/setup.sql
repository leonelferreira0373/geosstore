-- Table: public.products

-- DROP TABLE IF EXISTS public.products;

CREATE TABLE IF NOT EXISTS public.products
(
    id serial NOT NULL,
    name character varying(255) NOT NULL,
    price character varying(50),
    stock integer DEFAULT 0,
    sold integer DEFAULT 0,
    image text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Initial seed data
INSERT INTO public.products (name, price, stock, sold, image)
VALUES
('Nike Air Max Shoes', '827,000', 826, 243, 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-BRk-7mHRS8himrGmFM9CKNjwDjjY-NJQRKYEOzyT2KPwQjMuOPNJbZUKh_-XCcDTujoIgMyNZiwaiLguA0768wVsXpSfMVaKqL3fyY9HIv2P_Giw26NrjQhbhByCjuo-0hcgoImySRkhtvRt6kAzzsbmuS6YK-4vHFU7RcClT_3yD4IWi-HjyLz-8x5vCGdgdkkhvwP3SIw-Jwi5yFLppMmDJLHw40Hy96cU8sijnapEdK9tBVf2kJu6QojacWPjVLKJUalXl-nH'),
('Beige Running Shoe', '950,000', 120, 45, 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7ZUcBNE50PiOBh_A-w1D-gsE09-xEtHfAZaEZFVD5MUK3oSrM_RlnhezPa6Oxz07jIMJJW8r09lEsDDwEzTk5HbueQg1VkoYdwQshrMcCCYqI0PfQCYzQbPfo149s3KlXQaLeKlGkCQn-aoMLKUk7Jm5ZMkqecAWQgMODJcibZD7KHuxQagAVDum-NBOv4_KlzxMX7KS0UkbNHTbafzzWWdg16nigYf0FQVrn-VrajEWnR94aA2HUOssTqYsvLuUlWwljLuFwQeAU');
