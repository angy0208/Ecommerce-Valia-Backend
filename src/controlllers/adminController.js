const jwt = require("jsonwebtoken");

async function login(req, res) {
    try {
        const { password } = req.body;

        if (!password) {

            return res.status(401).json({

                message: "Credenciales inválidas."

            });

        }

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                message: "Contraseña incorrecta."
            });
        }
        const token = jwt.sign(
            { role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.status(200).json({
            message: "Inicio de sesión exitoso.",
            token
        });

    } catch (error) {
        console.error("Error en login:", error);

        return res.status(500).json({
            message: "Error interno del servidor."
        });
    }
}

module.exports = {
    login
};