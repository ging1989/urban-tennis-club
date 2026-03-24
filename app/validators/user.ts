import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const signupValidator = vine.create({
  fullName: vine.string().optional().nullable(),
  username: vine
    .string()
    .minLength(3)
    .maxLength(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .unique({ table: 'users', column: 'username' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password().confirmed({ confirmationField: 'passwordConfirmation' }),
})
