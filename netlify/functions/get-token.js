// netlify/functions/get-token.js

exports.handler = async function(event, context) {
    // In ambiente Netlify, il token sarà disponibile come variabile d'ambiente
    const token = process.env.ACCESS_TOKEN;
    
    if (!token) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Token non configurato' })
        };
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ token: token })
    };
};
