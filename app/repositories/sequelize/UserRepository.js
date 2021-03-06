const BaseRepository = require('./BaseRepository')
const User = require('../../models').user

// const { sendWelcomeEmail } = require('../emails/mailer');

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
class UserRepository {
    async generateAuthToken(user) {
        const token = jwt.sign(
            { id: user.id.toString() },
            process.env.JWT_SECRET
        )

        const tokens = JSON.parse(user.tokens)
        tokens[token] = true
        user.tokens = JSON.stringify(tokens)
        await user.save()
        return token
    }

    async create(data) {
        const userModel = new BaseRepository(User)
        if (data.email) {
            let exists = await userModel.find({ email: data.email })

            if (exists) {
                throw new Error('User with username already exits!!')
            }
        }

        if (data.username) {
            let exists = await userModel.find({ username: data.username })

            if (exists) {
                throw new Error('User with username already exits!!')
            }
        }

        data.id = uuidv4()
        data.tokens = JSON.stringify({})
        const user = await userModel.save(data)
        const token = await this.generateAuthToken(user)

        // send verification email
        // sendWelcomeEmail(user.email, user.name).catch(error => {
        //   return error.message
        // });

        return { user, token }
    }

    async login(data) {
        if (!data.email || !data.password) {
            throw new Error('Invalid user credentials')
        }

        const userModel = new BaseRepository(User)
        let user = await userModel.find({ email: data.email })

        if (!user) {
            user = await userModel.find({ username: data.email })
            if (!user) throw new Error('Invalid user credentials')
        }

        const isMatch = await bcrypt.compare(data.password, user.password)
        if (!isMatch) {
            throw new Error('Invalid user credentials')
        }

        const token = await this.generateAuthToken(user)
        delete user.dataValues.tokens
        delete user.dataValues.password
        return { user, token }
    }
}

module.exports = UserRepository
