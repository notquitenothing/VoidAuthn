import { Router, type Request, type Response } from "express"
import { router as interactionRouter } from "./interaction"
import { provider } from "../oidc/provider"
import { db } from "../db/db"
import { getUserById } from "../db/user"
import { userRouter } from "./user"
import type { Group, UserGroup } from "@shared/db/Group"
import { adminRouter } from "./admin"
import type { UserDetails } from "@shared/api-response/UserDetails"
import { authRouter } from "./auth"
import { als } from "../util/als"
import { publicRouter } from "./public"
import { oidcLoginPath } from "@shared/oidc"
import appConfig from "../util/config"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: UserDetails
    }
  }
}

export const router = Router()

router.use((_req, _res, next) => {
  als.run({}, () => {
    next()
  })
})

// proxy auth common
async function proxyAuth(url: URL, req: Request, res: Response) {
  const ctx = provider.createContext(req, res)
  const sessionId = ctx.cookies.get("x-voidauthn-session-uid")
  const session = sessionId ? await provider.Session.adapter.findByUid(sessionId) : null
  const accountId = session?.accountId
  const user = accountId ? await getUserById(accountId) : null
  if (!user) {
    res.redirect(`${appConfig.APP_DOMAIN}${oidcLoginPath(url.href)}`)
    return
  }

  const groups = await db().select("name")
    .table<Group>("group")
    .innerJoin<UserGroup>("user_group", "user_group.groupId", "group.id").where({ userId: user.id })
    .orderBy("name", "asc")

  // check if user may access url
  // TODO: check if there is a proxy-auth domain

  res.setHeader("Remote-User", user.username)
  if (user.email) {
    res.setHeader("Remote-Email", user.email)
  }
  if (user.name) {
    res.setHeader("Remote-Name", user.name)
  }
  if (groups.length) {
    res.setHeader("Remote-Groups", groups.map(g => g.name).join(","))
  }
  res.send()
}

// proxy cookie auth endpoints
router.get("/authz/forward-auth", async (req: Request, res) => {
  const proto = req.headersDistinct["x-forwarded-proto"]?.[0]
  const host = req.headersDistinct["x-forwarded-host"]?.[0]
  const path = req.headersDistinct["x-forwarded-uri"]?.[0]
  const url = proto && host ? URL.parse(`${proto}://${host}${path ?? ""}`) : null
  if (!url) {
    res.sendStatus(400)
    return
  }
  await proxyAuth(url, req, res)
})

router.get("/authz/auth-request", async (req: Request, res) => {
  const headerUrl = req.headersDistinct["x-original-url"]?.[0]
  const url = headerUrl ? URL.parse(headerUrl) : null
  if (!url) {
    res.sendStatus(400)
    return
  }
  await proxyAuth(url, req, res)
})

// Set user on reqest
router.use(async (req: Request, res, next) => {
  try {
    const ctx = provider.createContext(req, res)
    const session = await provider.Session.get(ctx)
    if (!session.accountId) {
      next()
      return
    }

    const user = await getUserById(session.accountId)

    if (user) {
      req.user = {
        ...user,
        groups: (await db().select()
          .table<UserGroup>("user_group")
          .innerJoin<Group>("group", "user_group.groupId", "group.id")
          .where({ userId: user.id }).orderBy("name", "asc"))
          .map((g) => {
            return g.name
          }),
      }
    }
  } catch (_e) {
    // do nothing
  }
  next()
})

router.get("/cb", (req, res) => {
  const { error, error_description, iss } = req.query
  if (error) {
    res.status(500).send({
      error,
      error_description,
      iss,
    })
    return
  }

  res.redirect("/")
})

router.use("/public", publicRouter)

router.use("/auth", authRouter)

router.use("/interaction", interactionRouter)

router.use("/user", userRouter)

router.use("/admin", adminRouter)

// API route was not found
router.use((_req, res) => {
  res.sendStatus(404)
  res.end()
})
