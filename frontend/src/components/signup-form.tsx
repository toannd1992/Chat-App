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

const signUpSchema = z.object({
  fistname: z.string().min(1, "Họ bắt buộc phải có"),
  lastname: z.string().min(1, "Tên bắt buộc phải có"),
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
});

type Formsignup = z.infer<typeof signUpSchema>; //gán kiểu cho form

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signUpStore } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Formsignup>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: Formsignup) => {
    const { fistname, lastname, email, password } = data;

    // goi api
    const res = await signUpStore(fistname, lastname, email, password);
    if (res) {
      navigate("/signin");
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
                <h1 className="text-2xl font-bold">Đăng ký</h1>
                <p>Chào mừng bạn! hãy đăng ký để bắt đầu!</p>
              </div>
              {/* họ và tên */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="fistname" className="text-sm">
                    Họ
                  </Label>
                  <Input type="text" id="fistname" {...register("fistname")} />
                  {errors.fistname && (
                    <p className="text-sm text-destructive">
                      {errors.fistname.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="lastname" className="text-sm">
                    Tên
                  </Label>
                  <Input type="text" id="lastname" {...register("lastname")} />
                  {errors.lastname && (
                    <p className="text-sm text-destructive">
                      {errors.lastname.message}
                    </p>
                  )}
                </div>
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
                  Tạo tài khoản
                </Button>
              </div>

              {/* chuyển hướng */}
              <div className="text-sm text-center">
                Đã có tài khoản?{" "}
                <a href="/signin" className="underline underline-offset-4">
                  Đăng nhập
                </a>
              </div>
            </div>
          </form>
          {/* image */}
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholderSignUp.png"
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
