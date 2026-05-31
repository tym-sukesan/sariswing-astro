import { supabaseAdmin } from "../supabase-admin";

type ApiErrorBody = {
  error?: string;
  detail?: string;
};

export async function invokeAdminEdgeFunction<T extends ApiErrorBody>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const {
    data: { session },
  } = await supabaseAdmin.auth.getSession();

  if (!session) {
    throw new Error("ログインが必要です。再度ログインしてください。");
  }

  const { data, error } = await supabaseAdmin.functions.invoke(functionName, {
    body,
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as T | null;
  if (!payload) {
    throw new Error(`Empty response from ${functionName}`);
  }

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}
