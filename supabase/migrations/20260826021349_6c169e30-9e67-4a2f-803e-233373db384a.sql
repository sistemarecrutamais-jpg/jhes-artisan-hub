
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','staff');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active categories" ON public.categories FOR SELECT TO anon USING (active = true);
CREATE POLICY "admin all categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "auth read categories" ON public.categories FOR SELECT TO authenticated USING (active = true OR public.is_admin());
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  production_days int NOT NULL DEFAULT 7 CHECK (production_days >= 0),
  allow_customization boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(active);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON public.products FOR SELECT TO anon USING (active = true);
CREATE POLICY "auth read products" ON public.products FOR SELECT TO authenticated USING (active = true OR public.is_admin());
CREATE POLICY "admin all products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_images_product ON public.product_images(product_id);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product images" ON public.product_images FOR SELECT TO anon USING (true);
CREATE POLICY "auth read product images" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin all product images" ON public.product_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.product_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  hex text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_colors_product ON public.product_colors(product_id);
GRANT SELECT ON public.product_colors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_colors TO authenticated;
GRANT ALL ON public.product_colors TO service_role;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product colors" ON public.product_colors FOR SELECT TO anon USING (true);
CREATE POLICY "auth read product colors" ON public.product_colors FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin all product colors" ON public.product_colors FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CUSTOMERS
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  complement text,
  neighborhood text,
  city text,
  zip_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_phone ON public.customers(phone);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all customers" ON public.customers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDERS
CREATE TYPE public.order_status AS ENUM ('novo','confirmado','em_producao','pronto','entregue','cancelado');
CREATE TYPE public.order_origin AS ENUM ('site','manual');
CREATE TYPE public.payment_status AS ENUM ('pendente','parcial','pago','reembolsado');
CREATE TYPE public.delivery_method AS ENUM ('retirada','entrega');

CREATE SEQUENCE public.order_number_seq START 1024;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number int NOT NULL UNIQUE DEFAULT nextval('public.order_number_seq'),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address text,
  complement text,
  neighborhood text,
  city text,
  zip_code text,
  delivery_method public.delivery_method NOT NULL DEFAULT 'retirada',
  status public.order_status NOT NULL DEFAULT 'novo',
  origin public.order_origin NOT NULL DEFAULT 'site',
  payment_status public.payment_status NOT NULL DEFAULT 'pendente',
  total numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  materials_cost numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  cancel_reason text,
  order_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  expected_date date,
  delivered_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_date ON public.orders(order_date);
CREATE INDEX idx_orders_expected ON public.orders(expected_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity int NOT NULL CHECK (quantity > 0),
  subtotal numeric(10,2) NOT NULL,
  color text,
  customization text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all order items" ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_osh_order ON public.order_status_history(order_id);
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all osh" ON public.order_status_history FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- MATERIALS
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  unit text NOT NULL DEFAULT 'un',
  quantity numeric(12,3) NOT NULL DEFAULT 0,
  total_paid numeric(10,2) NOT NULL DEFAULT 0,
  supplier text,
  purchase_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all materials" ON public.materials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity_used numeric(12,3) NOT NULL DEFAULT 0,
  unit_cost numeric(12,4) NOT NULL DEFAULT 0,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_materials_order ON public.order_materials(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_materials TO authenticated;
GRANT ALL ON public.order_materials TO service_role;
ALTER TABLE public.order_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all order materials" ON public.order_materials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.sync_order_materials_cost() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE oid uuid;
BEGIN
  oid := COALESCE(NEW.order_id, OLD.order_id);
  UPDATE public.orders o SET materials_cost = COALESCE((SELECT SUM(cost) FROM public.order_materials WHERE order_id = oid),0) WHERE o.id = oid;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_order_materials_cost AFTER INSERT OR UPDATE OR DELETE ON public.order_materials
FOR EACH ROW EXECUTE FUNCTION public.sync_order_materials_cost();

-- SETTINGS
CREATE TABLE public.settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  atelier_name text NOT NULL DEFAULT 'Ateliê da JHE',
  tagline text NOT NULL DEFAULT 'Costura • Crochê • Artesanato',
  description text,
  logo_url text,
  whatsapp text,
  email text,
  address text,
  opening_hours text,
  instagram text,
  facebook text,
  delivery_info text,
  pickup_info text,
  confirmation_message text NOT NULL DEFAULT 'Pedido recebido com sucesso! Em breve entraremos em contato pelo WhatsApp.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.settings FOR SELECT TO anon USING (true);
CREATE POLICY "auth read settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.settings (id, description, whatsapp, email, address, opening_hours, instagram, delivery_info, pickup_info)
VALUES (true,
 'Peças artesanais feitas à mão com carinho: crochê, costura e artesanato sob medida para a sua casa e para presentear.',
 '5511999999999', 'joicegoncalvesvh@gmail.com', 'Atendimento sob agendamento',
 'Segunda a sexta, 9h às 18h', 'atelie.da.jhe',
 'Entrega combinada pelo WhatsApp após a confirmação do pedido.',
 'Retirada no ateliê mediante agendamento.');
