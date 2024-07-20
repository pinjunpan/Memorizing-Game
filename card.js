//設定遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished"
}

const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

// MVC
const view = {
  // 特殊數字轉換
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1) //數字
    const symbol = Symbols[Math.floor(index / 13)] //花色

    return `<p>${number}</p>
        <img src="${symbol}">
        <p>${number}</p>`
  },

  getCardElement(index) {
    //綁data-index
    return `
      <div data-index="${index}" class="card back"></div>`
  },

  displayCards(indexes) { //
    const rootElement = document.querySelector("#cards")
    rootElement.innerHTML = indexes //參數代表隨機陣列，不跟utility耦合
      .map(index => this.getCardElement(index)) //迭代陣列
      .join("") //陣列合併成字串
  },

  flipCards(...cards) { //...把參數變陣列，cards=[1,2,3,4,5]
    cards.map(card => {
      //如果是背面，回傳正面
      if (card.classList.contains("back")) {
        card.classList.remove("back")
        card.innerHTML = this.getCardContent(Number(card.dataset.index)) //字串轉數字
        return
      }

      //如果是正面，回傳背面
      card.classList.add("back")
      card.innerHTML = null
    })
  },

  //配對成功
  pairCard(...cards) {
    cards.map(card => card.classList.add("paired"))
  },

  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`
  },

  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`
  },

  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add("wrong")
      //讓卡片可再次閃爍 //EventListener是一次性，觸發完即消失
      card.addEventListener("animationend", e => card.classList.remove("wrong"), { once: true })
    })
  },

  showGameFinished() {
    const div = document.createElement("div")
    div.classList.add("completed")
    div.innerHTML = `
    <p>Complete!</p>
    <p>Score: ${model.score}</p>
    <p>You've tried: ${model.triedTimes} times</p>
    `

    const header = document.querySelector("#header")
    header.before(div)
  }
}

const utility = {
  //隨機陣列
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys()) //[0, 1, ..., count-1]
    for (let index = number.length - 1; index > 0; index--) { //找到最後一張牌
      let randomIndex = Math.floor(Math.random() * (index + 1)) //隨機交換的牌
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] //解構賦值，左邊的變數被賦予右邊的對應值 //分號隔開
    }
    return number
  }
}

const model = {
  revealedCards: [], //暫存牌組

  isRevealedCardsMatched() { //進行配對
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13 //return true or false
  },

  score: 0,
  triedTimes: 0,
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,

  generateCards() { //亂數配置52張牌
    view.displayCards(utility.getRandomNumberArray(52))
  },

  //依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {
    //在牌背時才能點擊
    if (!card.classList.contains("back")) {
      return
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break //使用break後面函式還是會繼續執行

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)

        if (model.isRevealedCardsMatched()) {
          //配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCard(...model.revealedCards) //灰底
          model.revealedCards = [] //清空陣列
          //52張牌皆配對成功
          if (model.score === 260) {
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return //結束函式
          }
          this.currentState = GAME_STATE.FirstCardAwaits //回起始狀態繼續配對
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000) //第1個參數：function本身，不是結果，this的對象是setTimeout，由瀏覽器提供 //停留1秒
        }
        break
    }
    console.log("current state", this.currentState)
    console.log("revealedCards", model.revealedCards.map(card => card.dataset.index))
  },

  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits //需改成controller
  },
}

controller.generateCards()

//Node List(Array-like)
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", event => {
    controller.dispatchCardAction(card)
  })
})
