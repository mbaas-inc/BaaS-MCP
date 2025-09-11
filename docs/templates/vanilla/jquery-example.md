# jQuery 연동 인증 예제

AIApp BaaS와 jQuery를 사용한 인증 시스템 구현 예제입니다.

## ⚠️ BaaS API 필수 요구사항

**LLM 코드 생성 시 반드시 포함해야 할 사항:**

- **API Base URL**: `https://api.aiapp.link`
- **project_id**: 필수 파라미터 - 없으면 401 에러 발생
- **쿠키 설정**: `xhrFields: { withCredentials: true }` 필수
- **로그인 응답**: `{ success, message, data: { access_token, token_type } }`
- **에러 응답**: `{ errorCode, message, detail: [...] }`

## 기본 jQuery 로그인 폼

### HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>jQuery 로그인</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h4 class="text-center">로그인</h4>
                    </div>
                    <div class="card-body">
                        <div id="alertContainer"></div>
                        
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="user_id" class="form-label">아이디</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="user_id" 
                                    name="user_id" 
                                    placeholder="아이디를 입력하세요"
                                    required
                                >
                            </div>
                            
                            <div class="mb-3">
                                <label for="user_pw" class="form-label">비밀번호</label>
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    id="user_pw" 
                                    name="user_pw" 
                                    placeholder="비밀번호를 입력하세요"
                                    required
                                >
                            </div>
                            
                            <div class="mb-3">
                                <label for="project_id" class="form-label">프로젝트 ID</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="project_id" 
                                    name="project_id" 
                                    readonly
                                    style="background-color: #f8f9fa;"
                                >
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input 
                                    type="checkbox" 
                                    class="form-check-input" 
                                    id="rememberMe"
                                >
                                <label class="form-check-label" for="rememberMe">
                                    로그인 상태 유지
                                </label>
                            </div>
                            
                            <button type="submit" class="btn btn-primary w-100" id="loginBtn">
                                <span class="btn-text">로그인</span>
                                <span class="spinner-border spinner-border-sm d-none" role="status"></span>
                            </button>
                        </form>
                        
                        <div class="text-center mt-3">
                            <a href="#" onclick="showSignupForm()">회원가입</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
```

### jQuery 로그인 스크립트

```javascript
$(document).ready(function() {
    // 설정
    const CONFIG = {
        API_ENDPOINT: 'https://api.aiapp.link',
        PROJECT_ID: '[PROJECT_ID]'
    };
    
    // 프로젝트 ID 설정
    $('#project_id').val(CONFIG.PROJECT_ID);
    
    // jQuery 로그인 플러그인
    $.fn.aiappLogin = function(options) {
        const settings = $.extend({
            apiEndpoint: CONFIG.API_ENDPOINT,
            projectId: CONFIG.PROJECT_ID,
            onSuccess: function(data) {
                console.log('로그인 성공:', data);
                window.location.href = '/dashboard';
            },
            onError: function(error) {
                showAlert('로그인에 실패했습니다.', 'danger');
            }
        }, options);
        
        return this.each(function() {
            const $form = $(this);
            
            $form.on('submit', function(e) {
                e.preventDefault();
                
                const formData = $form.serializeArray();
                const loginData = {};
                
                // 폼 데이터를 객체로 변환
                $.each(formData, function(i, field) {
                    loginData[field.name] = field.value;
                });
                
                loginData.project_id = settings.projectId;
                
                // 로딩 상태 설정
                setLoading($form, true);
                
                // 로그인 요청
                $.ajax({
                    url: settings.apiEndpoint + '/account/login',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(loginData),
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function(response) {
                        if (response.success) {
                            showAlert('로그인이 완료되었습니다.', 'success');
                            settings.onSuccess(response.data);
                        } else {
                            settings.onError(new Error(response.message));
                        }
                    },
                    error: function(xhr) {
                        let errorMessage = '로그인에 실패했습니다.';
                        
                        switch(xhr.status) {
                            case 401:
                                errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
                                break;
                            case 422:
                                errorMessage = '입력값을 확인해주세요.';
                                break;
                            case 500:
                                errorMessage = '서버 오류가 발생했습니다.';
                                break;
                        }
                        
                        showAlert(errorMessage, 'danger');
                        settings.onError(new Error(errorMessage));
                    },
                    complete: function() {
                        setLoading($form, false);
                    }
                });
            });
        });
    };
    
    // 로그인 폼 초기화
    $('#loginForm').aiappLogin({
        onSuccess: function(data) {
            // 성공 후 대시보드로 이동
            setTimeout(function() {
                window.location.href = '/dashboard';
            }, 1500);
        }
    });
    
    // 유틸리티 함수들
    function setLoading($form, loading) {
        const $btn = $form.find('#loginBtn');
        const $text = $btn.find('.btn-text');
        const $spinner = $btn.find('.spinner-border');
        const $inputs = $form.find('input');
        
        if (loading) {
            $btn.prop('disabled', true);
            $inputs.prop('disabled', true);
            $text.text('로그인 중...');
            $spinner.removeClass('d-none');
        } else {
            $btn.prop('disabled', false);
            $inputs.prop('disabled', false);
            $text.text('로그인');
            $spinner.addClass('d-none');
        }
    }
    
    function showAlert(message, type = 'danger') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        $('#alertContainer').html(alertHtml);
        
        // 3초 후 자동 제거
        if (type === 'success') {
            setTimeout(function() {
                $('.alert').fadeOut();
            }, 3000);
        }
    }
});
```

## jQuery 회원가입 플러그인

### 회원가입 폼

```html
<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">
                    <h4 class="text-center">회원가입</h4>
                </div>
                <div class="card-body">
                    <div id="signupAlertContainer"></div>
                    
                    <form id="signupForm">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="signup_user_id" class="form-label">
                                        아이디 <span class="text-danger">*</span>
                                    </label>
                                    <div class="input-group">
                                        <input 
                                            type="text" 
                                            class="form-control" 
                                            id="signup_user_id" 
                                            name="user_id" 
                                            placeholder="4-20자 영문/숫자"
                                            required
                                        >
                                        <button class="btn btn-outline-secondary" type="button" id="checkDuplicateBtn">
                                            중복확인
                                        </button>
                                    </div>
                                    <div class="form-text" id="userIdStatus"></div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="signup_name" class="form-label">
                                        이름 <span class="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        id="signup_name" 
                                        name="name" 
                                        placeholder="실명을 입력하세요"
                                        required
                                    >
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="signup_user_pw" class="form-label">
                                        비밀번호 <span class="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="password" 
                                        class="form-control" 
                                        id="signup_user_pw" 
                                        name="user_pw" 
                                        placeholder="최소 8자 이상"
                                        required
                                    >
                                    <div class="form-text">
                                        <div class="progress mt-2" style="height: 5px;">
                                            <div class="progress-bar" id="passwordStrength" style="width: 0%"></div>
                                        </div>
                                        <small id="strengthText"></small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="signup_user_pw_confirm" class="form-label">
                                        비밀번호 확인 <span class="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="password" 
                                        class="form-control" 
                                        id="signup_user_pw_confirm" 
                                        name="user_pw_confirm" 
                                        placeholder="비밀번호를 다시 입력하세요"
                                        required
                                    >
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="signup_phone" class="form-label">
                                전화번호 <span class="text-danger">*</span>
                            </label>
                            <input 
                                type="tel" 
                                class="form-control" 
                                id="signup_phone" 
                                name="phone" 
                                placeholder="010-1234-5678"
                                required
                            >
                        </div>
                        
                        <!-- 사용자 정의 필드 -->
                        <div id="customFieldsContainer"></div>
                        
                        <div class="mb-3 form-check">
                            <input 
                                type="checkbox" 
                                class="form-check-input" 
                                id="is_reserved"
                                name="is_reserved"
                            >
                            <label class="form-check-label" for="is_reserved">
                                예약 계정으로 생성
                            </label>
                        </div>
                        
                        <button type="submit" class="btn btn-success w-100" id="signupBtn">
                            <span class="btn-text">회원가입</span>
                            <span class="spinner-border spinner-border-sm d-none" role="status"></span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
```

### jQuery 회원가입 스크립트

```javascript
$(document).ready(function() {
    // jQuery 회원가입 플러그인
    $.fn.aiappSignup = function(options) {
        const settings = $.extend({
            apiEndpoint: CONFIG.API_ENDPOINT,
            projectId: CONFIG.PROJECT_ID,
            customFields: ['age', 'department'],
            onSuccess: function(data) {
                console.log('회원가입 성공:', data);
                showSignupAlert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.', 'success');
                setTimeout(function() {
                    window.location.href = '/account/login';
                }, 2000);
            },
            onError: function(error) {
                showSignupAlert('회원가입에 실패했습니다.', 'danger');
            }
        }, options);
        
        return this.each(function() {
            const $form = $(this);
            
            // 사용자 정의 필드 생성
            if (settings.customFields && settings.customFields.length > 0) {
                createCustomFields(settings.customFields);
            }
            
            // 이벤트 리스너 등록
            setupSignupEvents($form, settings);
            
            // 폼 제출 처리
            $form.on('submit', function(e) {
                e.preventDefault();
                handleSignupSubmit($form, settings);
            });
        });
    };
    
    // 사용자 정의 필드 생성
    function createCustomFields(fields) {
        const $container = $('#customFieldsContainer');
        
        if (fields.length > 0) {
            $container.append('<h5 class="mt-4 mb-3">추가 정보</h5>');
        }
        
        fields.forEach(function(fieldName) {
            const fieldLabel = getFieldLabel(fieldName);
            const fieldHtml = `
                <div class="mb-3">
                    <label for="custom_${fieldName}" class="form-label">${fieldLabel}</label>
                    <input 
                        type="text" 
                        class="form-control" 
                        id="custom_${fieldName}" 
                        name="${fieldName}" 
                        placeholder="${fieldLabel}를 입력하세요"
                    >
                </div>
            `;
            $container.append(fieldHtml);
        });
    }
    
    function getFieldLabel(fieldName) {
        const labels = {
            age: '나이',
            department: '부서',
            company: '회사명',
            position: '직책'
        };
        return labels[fieldName] || fieldName;
    }
    
    // 이벤트 설정
    function setupSignupEvents($form, settings) {
        // 아이디 중복 확인
        $('#checkDuplicateBtn').on('click', function() {
            checkUserIdDuplicate(settings);
        });
        
        // 실시간 유효성 검사
        $form.find('input').on('input', function() {
            validateField($(this));
        });
        
        // 비밀번호 강도 체크
        $('#signup_user_pw').on('input', function() {
            checkPasswordStrength($(this).val());
        });
        
        // 전화번호 자동 포맷팅
        $('#signup_phone').on('input', function() {
            formatPhoneNumber($(this));
        });
    }
    
    // 회원가입 제출 처리
    function handleSignupSubmit($form, settings) {
        // 유효성 검사
        if (!validateSignupForm($form)) {
            return;
        }
        
        const formData = $form.serializeArray();
        const signupData = {
            project_id: settings.projectId,
            data: {}
        };
        
        // 폼 데이터를 객체로 변환
        $.each(formData, function(i, field) {
            if (['age', 'department', 'company', 'position'].includes(field.name)) {
                signupData.data[field.name] = field.value;
            } else if (field.name === 'is_reserved') {
                signupData[field.name] = true;
            } else if (field.name !== 'user_pw_confirm') {
                signupData[field.name] = field.value;
            }
        });
        
        // 체크박스 처리
        signupData.is_reserved = $('#is_reserved').is(':checked');
        
        // 로딩 상태 설정
        setSignupLoading($form, true);
        
        // 회원가입 요청
        $.ajax({
            url: settings.apiEndpoint + '/account/signup',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(signupData),
            success: function(response) {
                if (response.success) {
                    settings.onSuccess(response.data);
                } else {
                    settings.onError(new Error(response.message));
                }
            },
            error: function(xhr) {
                let errorMessage = '회원가입에 실패했습니다.';
                
                switch(xhr.status) {
                    case 409:
                        errorMessage = '이미 사용 중인 아이디입니다.';
                        break;
                    case 422:
                        errorMessage = '입력값을 확인해주세요.';
                        break;
                }
                
                showSignupAlert(errorMessage, 'danger');
                settings.onError(new Error(errorMessage));
            },
            complete: function() {
                setSignupLoading($form, false);
            }
        });
    }
    
    // 아이디 중복 확인
    function checkUserIdDuplicate(settings) {
        const userId = $('#signup_user_id').val().trim();
        
        if (userId.length < 4) {
            showUserIdStatus('아이디는 4자 이상이어야 합니다.', 'danger');
            return;
        }
        
        const $btn = $('#checkDuplicateBtn');
        $btn.prop('disabled', true).text('확인 중...');
        
        // 실제 API가 있다면 사용, 없으면 랜덤 결과
        setTimeout(function() {
            const isAvailable = Math.random() > 0.5; // 임시 랜덤 결과
            
            if (isAvailable) {
                showUserIdStatus('사용 가능한 아이디입니다.', 'success');
                $('#signup_user_id').data('checked', true);
            } else {
                showUserIdStatus('이미 사용 중인 아이디입니다.', 'danger');
                $('#signup_user_id').data('checked', false);
            }
            
            $btn.prop('disabled', false).text('중복확인');
        }, 1000);
    }
    
    function showUserIdStatus(message, type) {
        const $status = $('#userIdStatus');
        $status.removeClass('text-success text-danger')
               .addClass(`text-${type === 'success' ? 'success' : 'danger'}`)
               .text(message);
    }
    
    // 비밀번호 강도 체크
    function checkPasswordStrength(password) {
        let strength = 0;
        let strengthText = '';
        let strengthClass = '';
        
        if (!password) {
            $('#passwordStrength').css('width', '0%').removeClass();
            $('#strengthText').text('');
            return;
        }
        
        // 길이 체크
        if (password.length >= 8) strength += 25;
        
        // 대소문자 체크
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        
        // 숫자 체크
        if (/\d/.test(password)) strength += 25;
        
        // 특수문자 체크
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 25;
        
        if (strength <= 25) {
            strengthText = '약함';
            strengthClass = 'bg-danger';
        } else if (strength <= 50) {
            strengthText = '보통';
            strengthClass = 'bg-warning';
        } else if (strength <= 75) {
            strengthText = '좋음';
            strengthClass = 'bg-info';
        } else {
            strengthText = '매우 강함';
            strengthClass = 'bg-success';
        }
        
        $('#passwordStrength').css('width', strength + '%')
                             .removeClass()
                             .addClass('progress-bar ' + strengthClass);
        $('#strengthText').text(`비밀번호 강도: ${strengthText}`);
    }
    
    // 전화번호 포맷팅
    function formatPhoneNumber($input) {
        let value = $input.val().replace(/\D/g, '');
        
        if (value.startsWith('010')) {
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 7) {
                value = value.slice(0, 3) + '-' + value.slice(3);
            } else {
                value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
            }
        }
        
        $input.val(value);
    }
    
    // 필드 유효성 검사
    function validateField($field) {
        const fieldName = $field.attr('name');
        const value = $field.val();
        let isValid = true;
        let message = '';
        
        switch (fieldName) {
            case 'user_id':
                if (value && (value.length < 4 || value.length > 20)) {
                    isValid = false;
                    message = '아이디는 4-20자여야 합니다.';
                } else if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
                    isValid = false;
                    message = '영문자와 숫자만 사용 가능합니다.';
                }
                // 중복 확인 상태 초기화
                if (value !== $field.data('lastChecked')) {
                    $field.removeData('checked');
                    $('#userIdStatus').text('');
                }
                break;
                
            case 'user_pw_confirm':
                const password = $('#signup_user_pw').val();
                if (value && value !== password) {
                    isValid = false;
                    message = '비밀번호가 일치하지 않습니다.';
                }
                break;
                
            case 'phone':
                if (value && !/^010-\d{4}-\d{4}$/.test(value)) {
                    isValid = false;
                    message = '010-1234-5678 형식으로 입력해주세요.';
                }
                break;
        }
        
        // UI 상태 업데이트
        if (isValid) {
            $field.removeClass('is-invalid').addClass('is-valid');
            $field.siblings('.invalid-feedback').remove();
        } else {
            $field.removeClass('is-valid').addClass('is-invalid');
            $field.siblings('.invalid-feedback').remove();
            $field.after(`<div class="invalid-feedback">${message}</div>`);
        }
        
        return isValid;
    }
    
    // 전체 폼 유효성 검사
    function validateSignupForm($form) {
        let isValid = true;
        
        // 필수 필드 검사
        $form.find('input[required]').each(function() {
            if (!validateField($(this))) {
                isValid = false;
            }
        });
        
        // 아이디 중복 확인 검사
        const $userId = $('#signup_user_id');
        if (!$userId.data('checked')) {
            showSignupAlert('아이디 중복 확인을 해주세요.', 'warning');
            isValid = false;
        }
        
        // 비밀번호 확인 검사
        const password = $('#signup_user_pw').val();
        const confirmPassword = $('#signup_user_pw_confirm').val();
        if (password !== confirmPassword) {
            $('#signup_user_pw_confirm').removeClass('is-valid').addClass('is-invalid');
            isValid = false;
        }
        
        return isValid;
    }
    
    function setSignupLoading($form, loading) {
        const $btn = $form.find('#signupBtn');
        const $text = $btn.find('.btn-text');
        const $spinner = $btn.find('.spinner-border');
        const $inputs = $form.find('input, button');
        
        if (loading) {
            $btn.prop('disabled', true);
            $inputs.prop('disabled', true);
            $text.text('가입 중...');
            $spinner.removeClass('d-none');
        } else {
            $btn.prop('disabled', false);
            $inputs.prop('disabled', false);
            $text.text('회원가입');
            $spinner.addClass('d-none');
        }
    }
    
    function showSignupAlert(message, type = 'danger') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        $('#signupAlertContainer').html(alertHtml);
        
        if (type === 'success') {
            setTimeout(function() {
                $('.alert').fadeOut();
            }, 3000);
        }
    }
    
    // 회원가입 폼 초기화
    $('#signupForm').aiappSignup({
        customFields: ['age', 'department'],
        onSuccess: function(data) {
            // 성공 후 로그인 페이지로 이동
            setTimeout(function() {
                window.location.href = '/account/login';
            }, 2000);
        }
    });
});
```

## jQuery AJAX 헬퍼

### 인증 API 래퍼

```javascript
// jquery-auth-api.js
(function($) {
    'use strict';
    
    // AIApp BaaS API 래퍼
    $.aiapp = {
        config: {
            apiEndpoint: 'https://api.aiapp.link',
            projectId: '[PROJECT_ID]'
        },
        
        // 설정 업데이트
        configure: function(options) {
            $.extend(this.config, options);
        },
        
        // 공통 AJAX 요청
        request: function(options) {
            const defaults = {
                xhrFields: {
                    withCredentials: true
                },
                contentType: 'application/json',
                dataType: 'json',
                beforeSend: function(xhr) {
                    // CSRF 토큰이 있으면 헤더에 추가
                    const token = $('meta[name="csrf-token"]').attr('content');
                    if (token) {
                        xhr.setRequestHeader('X-CSRF-Token', token);
                    }
                }
            };
            
            const settings = $.extend({}, defaults, options);
            
            // URL이 상대 경로면 API 엔드포인트 추가
            if (settings.url && !settings.url.startsWith('http')) {
                settings.url = this.config.apiEndpoint + settings.url;
            }
            
            return $.ajax(settings);
        },
        
        // 로그인
        login: function(credentials) {
            const data = $.extend({}, credentials, {
                project_id: this.config.projectId
            });
            
            return this.request({
                url: '/account/login',
                method: 'POST',
                data: JSON.stringify(data)
            });
        },
        
        // 회원가입
        signup: function(userData) {
            const data = $.extend({}, userData, {
                project_id: this.config.projectId
            });
            
            return this.request({
                url: '/account/signup',
                method: 'POST',
                data: JSON.stringify(data)
            });
        },
        
        // 사용자 정보 조회
        getUserInfo: function() {
            return this.request({
                url: '/account/info',
                method: 'GET'
            });
        },
        
        // 로그아웃
        logout: function() {
            return this.request({
                url: '/logout',
                method: 'POST'
            });
        },
        
        // 프로필 업데이트
        updateProfile: function(profileData) {
            return this.request({
                url: '/profile',
                method: 'PUT',
                data: JSON.stringify(profileData)
            });
        },
        
        // 비밀번호 변경
        changePassword: function(oldPassword, newPassword) {
            return this.request({
                url: '/change-password',
                method: 'POST',
                data: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });
        },
        
        // 아이디 중복 확인 (API가 있다면)
        checkUserId: function(userId) {
            return this.request({
                url: '/check-userid',
                method: 'POST',
                data: JSON.stringify({
                    user_id: userId,
                    project_id: this.config.projectId
                })
            });
        }
    };
    
    // jQuery 플러그인으로 등록
    $.fn.extend({
        // 로그인 폼
        aiappLogin: function(options) {
            return this.each(function() {
                const $form = $(this);
                const settings = $.extend({
                    onSuccess: function(data) { console.log('Login success:', data); },
                    onError: function(error) { console.log('Login error:', error); }
                }, options);
                
                $form.on('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = {};
                    $form.serializeArray().forEach(function(field) {
                        formData[field.name] = field.value;
                    });
                    
                    $.aiapp.login(formData)
                        .done(function(response) {
                            if (response.success) {
                                settings.onSuccess(response.data);
                            } else {
                                settings.onError(new Error(response.message));
                            }
                        })
                        .fail(function(xhr) {
                            settings.onError(new Error('Login failed'));
                        });
                });
            });
        },
        
        // 회원가입 폼
        aiappSignup: function(options) {
            return this.each(function() {
                const $form = $(this);
                const settings = $.extend({
                    onSuccess: function(data) { console.log('Signup success:', data); },
                    onError: function(error) { console.log('Signup error:', error); }
                }, options);
                
                $form.on('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = {};
                    $form.serializeArray().forEach(function(field) {
                        if (field.name !== 'user_pw_confirm') {
                            formData[field.name] = field.value;
                        }
                    });
                    
                    // 체크박스 처리
                    formData.is_reserved = $form.find('input[name="is_reserved"]').is(':checked');
                    
                    $.aiapp.signup(formData)
                        .done(function(response) {
                            if (response.success) {
                                settings.onSuccess(response.data);
                            } else {
                                settings.onError(new Error(response.message));
                            }
                        })
                        .fail(function(xhr) {
                            settings.onError(new Error('Signup failed'));
                        });
                });
            });
        },
        
        // 인증 상태 확인
        requireAuth: function(options) {
            const settings = $.extend({
                redirectUrl: '/account/login',
                onUnauthorized: function() {
                    window.location.href = settings.redirectUrl;
                }
            }, options);
            
            return this.each(function() {
                const $element = $(this);
                
                $.aiapp.getUserInfo()
                    .done(function(response) {
                        if (response.success) {
                            $element.show();
                        } else {
                            settings.onUnauthorized();
                        }
                    })
                    .fail(function() {
                        settings.onUnauthorized();
                    });
            });
        }
    });
    
})(jQuery);
```

### 사용 예제

```javascript
$(document).ready(function() {
    // API 설정
    $.aiapp.configure({
        projectId: 'your-project-id-here'
    });
    
    // 로그인 폼 설정
    $('#loginForm').aiappLogin({
        onSuccess: function(data) {
            alert('로그인 성공!');
            window.location.href = '/dashboard';
        },
        onError: function(error) {
            alert('로그인 실패: ' + error.message);
        }
    });
    
    // 회원가입 폼 설정
    $('#signupForm').aiappSignup({
        onSuccess: function(data) {
            alert('회원가입 성공!');
            window.location.href = '/account/login';
        },
        onError: function(error) {
            alert('회원가입 실패: ' + error.message);
        }
    });
    
    // 보호된 컨텐츠
    $('.protected-content').requireAuth({
        redirectUrl: '/account/login'
    });
    
    // 직접 API 호출 예제
    $('.user-info-btn').on('click', function() {
        $.aiapp.getUserInfo()
            .done(function(response) {
                if (response.success) {
                    console.log('User info:', response.data);
                }
            })
            .fail(function() {
                alert('사용자 정보를 가져올 수 없습니다.');
            });
    });
});
```

## Bootstrap 모달과 연동

### 로그인 모달

```html
<!-- 로그인 모달 -->
<div class="modal fade" id="loginModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">로그인</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="modalAlertContainer"></div>
                <form id="modalLoginForm">
                    <!-- 로그인 폼 내용 -->
                </form>
            </div>
        </div>
    </div>
</div>
```

```javascript
// 모달 로그인 처리
$('#modalLoginForm').aiappLogin({
    onSuccess: function(data) {
        $('#loginModal').modal('hide');
        location.reload(); // 페이지 새로고침
    },
    onError: function(error) {
        const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show">
                ${error.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        $('#modalAlertContainer').html(alertHtml);
    }
});

// 인증이 필요한 버튼 클릭 시 모달 표시
$('.require-auth').on('click', function(e) {
    e.preventDefault();
    
    $.aiapp.getUserInfo()
        .done(function(response) {
            if (response.success) {
                // 이미 로그인됨 - 원래 동작 수행
                $(this).off('click').trigger('click');
            } else {
                // 로그인 필요 - 모달 표시
                $('#loginModal').modal('show');
            }
        })
        .fail(function() {
            $('#loginModal').modal('show');
        });
});
```

## 관련 문서

- [순수 JavaScript 로그인 폼](./account/login-form.md)
- [순수 JavaScript 회원가입 폼](./account/signup-form.md)
- [인증 상태 관리자](./auth-manager.md)
- [React 인증 컴포넌트](../react/auth-components.md)
- [Vue 인증 시스템](../vue/auth-composable.md)