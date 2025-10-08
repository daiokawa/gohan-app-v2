-- Function Search Path セキュリティ修正
-- search_pathを明示的に設定して、セキュリティリスクを軽減

-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- search_pathを設定した新しい関数を作成
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- トリガーを再作成
CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 権限を設定
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon;

-- 確認
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig as config
FROM pg_proc 
WHERE proname = 'update_updated_at_column';