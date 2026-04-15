EDELLYTYKSET

Varmista että sinulla on nämä ladattuna

   Node.js (versio 18 tai uudempi)

   (Git)

Voit tarkistaa jos ne ovat jo ladattuna kirjoittamalla terminaliin:

   node -v
   
   (git --version)

LATAUS VAIHTOEHDOT:
1. Kloonaa repository
git clone https://github.com/R-o-n-j-a/Ohjelmistoprojekti.git                 
ja mene projektin kansioon:
cd Ohjelmistoprojekti -komennolla

3. Asenna riippuvuudet
npm install
Tämä lataa Express ja Socket.io

4. Käynnistä serveri
npm start -komennolla                      
Sinun pitäisi nähdä:
Running at http://localhost:3000

5. Avaa peli
Avaa selaimesi ja mene:
http://localhost:3000

TAI

1. Lataa tiedostot

   Lataa projektin tiedostot omalle koneelle ja
mene projektin kansioon cd -komennolla

3. Asenna riippuvuudet
Kirjoita komentoriville npm install

4. Käynnistä serveri
Käynnistä serveri npm start -komennolla

5. Avaa peli
Avaa selain ja siirry osoitteeseen http://localhost:3000

MITEN PELATA

1. Syötä nimesi ja klikkaa Create New Room
2. Jaa 6-kirjaimen room code kaverillesi
3. Kaverisi avaa saman URL, syöttää heidän nimensä ja huoneen koodin ja klikkaa Join
4. Host voi lisätä botteja ja klikata Start Game kun on valmis
5. Pelaajat pelaavat vuorotellen, vain aktiivisen pelaajan napit ovat käytössä.
6. Kun kaikki pelaajat ovat pelanneet, dealer pelaa automaattisesti
7. Host voi aloittaa seuraavan kierroksen kun tulokset on näytetty.
