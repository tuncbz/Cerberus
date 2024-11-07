        const GIST_ID = '4cbd70174b7dee0b4f4d6e05b458cc3d';
        const GITHUB_TOKEN = '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'; 

        let videos = [];
        let currentVideo = null;

        function getDevicePathPrefix() {
            const isWindows = navigator.platform.includes('Win');
            //const isAndroid = navigator.userAgent.toLowerCase().includes("android");

            if (isWindows) {
                return "D:\\All_Clips\\";
            } else { // else if (isAndroid) 
                return "/storage/emulated/0/Download/Pip_English/All_Clips/";
            }
            return ""; 
        }

        async function fetchGistData() {
            const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`
                }
            });
            const data = await response.json();
            const content = JSON.parse(data.files["Repeat_Vid_DB.json"].content);
            videos = content;
        }

        function filterVideosBySelection() {
            const selectedCategories = [];
            if (document.getElementById("Movie_Clips").checked) selectedCategories.push("Movie_Clips");
            if (document.getElementById("Words_Forms").checked) selectedCategories.push("Words_Forms");
            if (document.getElementById("Grammar").checked) selectedCategories.push("Grammar");
            if (document.getElementById("Dialogue_Vips").checked) selectedCategories.push("Dialogue_Vips");

            return videos.filter(video => selectedCategories.some(category => video.vid.includes(category)));
        }

async function getRandomVideo() {
            if (videos.length === 0) {
                alert("Video yüklenmedi!");
                return;
            }
    // Bugünün ve dünün tarihini kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugün saat kısmını sıfırlıyoruz
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Dün için tarihi alıyoruz

    let filteredVideos = filterVideosBySelection();

    // Videoları tarih ve puan filtresi ile ayırıyoruz
    filteredVideos = filteredVideos.filter(video => {
        if (video.date) {
            // Sadece tarihi alıyoruz (saat kısmı hariç)
            const videoDate = new Date(video.date.split(' ')[0].split('.').reverse().join('-'));
            // Bugün ve dün hariç olmalı
            return videoDate < yesterday && (video.count === 0 || video.count === undefined) && parseFloat(video.puan) < 4.1;
        }
        return (video.count === 0 || video.count === undefined) && parseFloat(video.puan) < 4.1;
    });

    if (filteredVideos.length === 0) {
        alert("Seçilen kriterlere uygun video bulunamadı.");
        return;
    }

    // Rastgele video seçimi
    currentVideo = filteredVideos[Math.floor(Math.random() * filteredVideos.length)];

    const devicePathPrefix = getDevicePathPrefix();
    const fullVideoPath = devicePathPrefix + currentVideo.vid;

    //document.getElementById("vid_name").textContent = `Video Adı: ${currentVideo.vid} P: ${currentVideo.puan}`;
	document.getElementById("vid_name").innerHTML = `Vid: ${currentVideo.vid} <span class="sp_puan">LP:${currentVideo.puan}</span>`;
    document.getElementById("video-source").src = fullVideoPath;
    document.getElementById("video-player").load();
    document.getElementById("rating_cont").style.display = "block";

    document.getElementById("video-player").play();
    console.log(fullVideoPath);

// ------------------------------------------------------------------------------ Altyazı işlemleri 
    let parts = fullVideoPath.split("/");
let videoName = parts[parts.length - 1];
let text = "";  // text değişkeni

    for (let i = 0; i < srtVerileri.length; i++) {
        if (srtVerileri[i].path === videoName) {
            text = srtVerileri[i].text;  // Eşleşen "path" bulunursa "text" değerini al
            break; 
        }
    }
    document.getElementById("lb_srt").innerHTML = fullVideoPath; //text;
    document.getElementById("lb_srt").style.display = "none"; 
    document.getElementById("ses_bts").style.display = "block"; 
}

        function toggleAudio() {
            const isAudioSelected = document.getElementById("ch_audio").checked;
            document.getElementById("video-player").style.display = isAudioSelected ? "none" : "block";
			document.getElementById("bt_replay").style.display = isAudioSelected ? "block" : "none";

            if (isAudioSelected) {
                //document.getElementById("audio-source").src = document.getElementById("video-source").src;
                //document.getElementById("audio-player").load();
                document.getElementById("video-player").play();
            }
        }

        let tempVideos = [];
        function submitRating(rating) {
            if (rating < 1 || rating > 5) {
                alert("Lütfen 1 ile 5 arasında bir puan girin.");
                return;
            }

            const updatedVideo = {...currentVideo};
            const oldRating = updatedVideo.puan ? parseFloat(updatedVideo.puan) : 0;
            const oldCount = updatedVideo.count || 0;
            const newCount = oldCount + 1;
            updatedVideo.puan = ((oldRating * oldCount + rating) / newCount).toFixed(1);
            updatedVideo.count = newCount;

            tempVideos = tempVideos.filter(video => video.vid !== updatedVideo.vid);
            tempVideos.push(updatedVideo);

            getRandomVideo();  // Yeni video seç
        }
		
function replayAudio() {
	document.getElementById("video-player").currentTime = 0;
	document.getElementById("video-player").play();
}	
// ---------------------------------------------------------------------------------------------------  Finish
async function finishWork() {
    if (tempVideos.length === 0) {
        alert("Henüz hiçbir puanlama yapmadınız.");
        return;
    }

    document.getElementById("video-player").pause();  // Video durduruluyor
    document.getElementById("video-player").currentTime = 0;  // Video sıfırlanıyor
	
    const currentDate = new Date().toLocaleDateString("tr-TR"); // Sadece tarihi al

    tempVideos.forEach(updatedVideo => {
        const index = videos.findIndex(video => video.vid === updatedVideo.vid);
        if (index !== -1) {
            videos[index] = updatedVideo;
            videos[index].date = currentDate;
        }
    });

    const updatedContent = JSON.stringify(videos, null, 2);

    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    "Repeat_Vid_DB.json": {
                        content: updatedContent
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error("GitHub Gist'e veri kaydedilemedi.");
        }

        alert("Çalışma başarıyla kaydedildi!");

    } catch (error) {
        // JSON kaydetme işlemi başarısız olduğunda hata mesajı
        alert("Veri kaydedilemedi. Tarayıcı hafızasındaki JSON verisi indiriliyor.");

        // Kullanıcının JSON verisini indirmesini sağlamak
        const blob = new Blob([updatedContent], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Repeat_Vid_DB.json"; // Dosya adı
        link.click();
    }
}
		
        // --------------------------------------------------------------------------------- İstatistik hesaplama fonksiyonu
        function statistic() {
            if (videos.length === 0) {
                alert("Json yüklenmedi!");
                return;
            }

            // Bugünün tarihini al
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Saat kısmını sıfırlıyoruz

            // Veri istatistiklerini saklayacak nesne
            const stats = {
                totalVideos: videos.length,
                filteredVideos: 0,
                averageRating: 0,
                todayVideos: 0,
            };

            let totalPuan = 0;
            let totalPuanCount = 0;
            let filteredCount = 0;

            // Verileri filtreleyip istatistikleri hesapla
            videos.forEach(video => {
                // Tarih kontrolü
                const videoDate = video.date ? new Date(video.date.split(' ')[0].split('.').reverse().join('-')) : null;

                // Bugün olan videoları say
                if (videoDate && videoDate >= today) {
                    stats.todayVideos++;
                }

                // Puan ortalamasını hesaplarken 0 puanları dışla
                if (video.puan && parseFloat(video.puan) > 0) {
                    totalPuan += parseFloat(video.puan);
                    totalPuanCount++;
                }

                // Filtreleme işlemini uygula (count 0 veya undefined, ve puan < 4.1)
                if ((video.count === 0 || video.count === undefined) && parseFloat(video.puan) < 4.1) {
                    filteredCount++;
                }
            });

            // Ortalama puan hesaplama (0 puanları dahil etmeden)
            stats.averageRating = totalPuanCount > 0 ? (totalPuan / totalPuanCount).toFixed(2) : 0;

            // Sonuçları kaydet
            stats.filteredVideos = filteredCount;
            
            // İstatistikleri kullanıcıya göster
            document.getElementById("tot_vids").textContent = `Tot: ${stats.totalVideos}`;
            document.getElementById("filt_vids").textContent = `Rem: ${stats.filteredVideos}`;
            document.getElementById("avg_rate").textContent = `Avg: ${stats.averageRating}`;
            document.getElementById("tdy_vids").textContent = `Today: ${stats.todayVideos}`;
        }

        // Sayfa yüklendiğinde verileri çek ve istatistik hesapla
        window.onload = async function () {
            await fetchGistData();  // Gist'ten verileri al
            statistic();  // İstatistik hesapla
        }
		//------------------------------------------------------------------------------------------- Manuel Download
function downJson() {
    const updatedContent = JSON.stringify(videos, null, 2); // videos dizisini JSON formatında al

    const blob = new Blob([updatedContent], { type: "application/json" }); // JSON verisini Blob olarak oluştur
    const link = document.createElement("a"); // Yeni bir <a> elementi oluştur
    link.href = URL.createObjectURL(blob); // Blob verisini bir URL'ye dönüştür
    link.download = "Repeat_Vid_DB.json"; // İndirilecek dosyanın ismi
    link.click(); // İndirme işlemini başlat
}

function srtShow() {
    document.getElementById("lb_srt").style.display = "block"; 
    document.getElementById("ses_bts").style.display = "none"; 
}
