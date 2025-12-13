import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod"; // tạo kiểu cho form
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

const signInSchema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
});

type Formsignin = z.infer<typeof signInSchema>; //gán kiểu cho form

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signInStore } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Formsignin>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: Formsignin) => {
    const { email, password } = data;
    // goi api
    const res = await signInStore(email, password);
    if (res) {
      navigate("/");
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header */}
              <div className="flex flex-col gap-4 items-center text-center">
                <a href="/">
                  <img src="/logo.svg" alt="logo" className="mx-auto"></img>
                </a>
                <h1 className="text-2xl font-bold">Đăng nhập</h1>
                <p>Chào mừng quay lại! Hãy đăng nhập để bắt đầu!</p>
              </div>

              {/* email */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm">
                  Email đăng nhập
                </Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="m@gmail.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {/* password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm">
                  Mật khẩu
                </Label>
                <Input
                  type="password"
                  id="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {/* đăng ký */}
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Đăng nhập
                </Button>
              </div>

              {/* chuyển hướng */}
              <div className="text-sm text-center">
                Chưa có tài khoản?{" "}
                <a href="/signup" className="underline underline-offset-4">
                  Đăng ký
                </a>
              </div>
            </div>
          </form>
          {/* image */}
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline underline-offset-4">
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều Khoản</a> và{" "}
        <a href="#">Dịch Vụ</a>.
      </div>
    </div>
  );
}
