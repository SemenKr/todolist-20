import { selectThemeMode, setIsLoggedInAC } from "@/app/app-slice"
import { AUTH_TOKEN } from "@/common/constants"
import { ResultCode } from "@/common/enums"
import { useAppDispatch, useAppSelector } from "@/common/hooks"
import { getTheme } from "@/common/theme"
import { useLazyGetCaptchaUrlQuery, useLoginMutation } from "@/features/auth/api/authApi"
import { type LoginInputs, loginSchema } from "@/features/auth/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import FormControl from "@mui/material/FormControl"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormGroup from "@mui/material/FormGroup"
import FormLabel from "@mui/material/FormLabel"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import { useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import styles from "./Login.module.css"

export const Login = () => {
  const themeMode = useAppSelector(selectThemeMode)

  const [login] = useLoginMutation()
  const [getCaptchaUrl] = useLazyGetCaptchaUrlQuery()

  const dispatch = useAppDispatch()

  const theme = getTheme(themeMode)
  const [captchaUrl, setCaptchaUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false, captcha: "" },
  })

  const onSubmit: SubmitHandler<LoginInputs> = (data) => {
    login(data).then((res) => {
      if (res.data?.resultCode === ResultCode.Success) {
        dispatch(setIsLoggedInAC({ isLoggedIn: true }))
        localStorage.setItem(AUTH_TOKEN, res.data.data.token)
        setCaptchaUrl(null)
        reset()
      }

      if (res.data?.fieldsErrors?.length) {
        res.data.fieldsErrors.forEach((fieldError) => {
          if (fieldError.field === "email" || fieldError.field === "password" || fieldError.field === "captcha") {
            setError(fieldError.field, { type: "server", message: fieldError.error })
          }
        })
      }

      if (res.data?.resultCode === ResultCode.Error && res.data?.messages?.length) {
        setError("root", { type: "server", message: res.data.messages[0] })
      }

      if (res.data?.resultCode === ResultCode.CaptchaError) {
        getCaptchaUrl().then((captchaRes) => {
          setCaptchaUrl(captchaRes.data?.url ?? null)
        })
      }
    })
  }

  return (
    <Grid container justifyContent={"center"}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl>
          <FormLabel>
            <p>
              To login get registered
              <a
                style={{ color: theme.palette.primary.main, marginLeft: "5px" }}
                href="https://social-network.samuraijs.com"
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
            </p>
            <p>or use common test account credentials:</p>
            <p>
              <b>Email:</b> free@samuraijs.com
            </p>
            <p>
              <b>Password:</b> free
            </p>
          </FormLabel>
          <FormGroup>
            <TextField label="Email" margin="normal" error={!!errors.email} {...register("email")} />
            {errors.email && <span className={styles.errorMessage}>{errors.email.message}</span>}
            <TextField
              type="password"
              label="Password"
              margin="normal"
              error={!!errors.password}
              {...register("password")}
            />
            {errors.password && <span className={styles.errorMessage}>{errors.password.message}</span>}
            {captchaUrl && (
              <>
                <img src={captchaUrl} alt="captcha" />
                <TextField label="Captcha" margin="normal" error={!!errors.captcha} {...register("captcha")} />
                {errors.captcha && <span className={styles.errorMessage}>{errors.captcha.message}</span>}
              </>
            )}
            <FormControlLabel
              label={"Remember me"}
              control={
                <Controller
                  name={"rememberMe"}
                  control={control}
                  render={({ field: { value, ...field } }) => <Checkbox {...field} checked={value} />}
                />
              }
            />
            {errors.root?.message && <span className={styles.errorMessage}>{errors.root.message}</span>}
            <Button type="submit" variant="contained" color="primary">
              Login
            </Button>
          </FormGroup>
        </FormControl>
      </form>
    </Grid>
  )
}
