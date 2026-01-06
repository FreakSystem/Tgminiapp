// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();

// Получаем данные пользователя
const user = tg.initDataUnsafe?.user;
if (user) {
    document.getElementById('username').textContent = user.first_name || "гость";
}

// Настраиваем кнопку Telegram внизу
tg.MainButton.setText("Закрыть приложение");
tg.MainButton.show();

// Обработка кнопки Telegram
tg.MainButton.onClick(() => {
    alert("Мини-приложение закрывается");
    tg.close();
});

// Обработка кнопки на странице
document.getElementById('actionButton').addEventListener('click', () => {
    alert("Вы нажали кнопку внутри мини-приложения!");
});
