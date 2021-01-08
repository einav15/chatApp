const socket = io()

//Elements
const messageForm = document.querySelector('#message__form')
const messageFormInput = messageForm.querySelector('input')
const messageFormBtn = messageForm.querySelector('button')
const sendLocationBtn = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

//Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = ()=>{ 
    const newMessage = messages.lastElementChild

    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    const visibleHeight = messages.offsetHeight

    const containerHeight = messages.scrollHeight

    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset)
        messages.scrollTop = messages.scrollHeight
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (link) => {
    const html = Mustache.render(locationTemplate, {
        createdAt: moment(link.createdAt).format('h:mm a'),
        username: link.username,
        href: link.href
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


socket.emit('join', { username, room }, (error) => {
    if (!!error) {
        alert(error)
        location.href = '/'
    }
})
//Event listeners
messageForm.addEventListener('submit', (event) => {
    event.preventDefault()

    messageFormBtn.setAttribute('disabled', 'disabled')
    if (messageFormInput.value !== '') {
        socket.emit('sendMessage', messageFormInput.value, (error) => {
            if (error)
                return console.log(error)

            console.log('Delivered!')

            messageFormInput.focus()
            messageFormInput.value = ''
        })
    }
    messageFormBtn.removeAttribute('disabled')
})

sendLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation)
        return alert('Not supported by your browser')

    sendLocationBtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit('sendLocation', {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
        }, () => {
            sendLocationBtn.removeAttribute('disabled')
        })

    })

})
